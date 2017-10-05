import _ from 'lodash'
import chai from 'chai'
import r from 'rethinkdb'
import Promise from 'bluebird'
import rethinkdbdash from 'rethinkdbdash'
import AccessControlList from 'acl'
import RethinkBackend from '../index'
import ms from 'ms'

// settings
const dbHost = { host: 'localhost', port: 28025 }
const PREFIX = 'acl_'
const TABLE = 'access'
const VERBOSE = process.env.TEST_VERBOSE

// data constants
const USER1 = 'user1@domain.com'
const USER2 = 'user2@domain.com'
const USER3 = 'user3@domain.com'
const ROLE_PARENT = 'parent'
const ROLE_ADMIN = 'admin'
const ROLE_USER = 'user'
const RES_A = 'a'
const RES_B = 'b'
const RES_ABC = 'a.b.c.*'
const PERM_READ = 'read'
const PERM_WRITE = 'write'

// database related
const d = rethinkdbdash({ servers: [ dbHost ] })
const R_SINGLE = 'r_single'
const R_MULTI = 'r_multi'
const D_SINGLE = 'd_single'
const D_MULTI = 'd_multi'
const macl = Promise.promisifyAll(new AccessControlList(new AccessControlList.memoryBackend()))

const DBS = [R_SINGLE, R_MULTI, D_SINGLE, D_MULTI]
const db = {}

// simple recursive sorting function to normalize arrays
// in responses across acl instances
function recursiveSort (obj) {
  if (_.isArray(obj)) {
    obj.sort()
    _.forEach(obj, val => {
      if (_.isObject(val)) recursiveSort(val)
    })
  } else if (obj && _.isObject(obj)) {
    _.forEach(obj, val => {
      if (_.isObject(val)) recursiveSort(val)
    })
  }
  return obj
}

// this will be the main testing method. it will compare the
// output of the module with the output of the memory backend's output
function Test (method, args, options) {
  let methodName = method.replace(/Async$/i, '')
  method = `${methodName}Async`
  options = options || {}
  args = _.castArray(args)

  // construct a message
  options.message = options.message || `Should call "${methodName}" with args ${JSON.stringify(args)} without error/expected output`
  options.timeout = options.timeout || '30 seconds'

  it(options.message, done => {
    try {
      if (!_.isFunction(macl[method])) {
        return done(new Error(`Error: "${method}" is not a valid method`))
      }

      // get the output of the memory module as a comparison value
      return macl[method].apply(macl, args)
        .then(expectedValue => {
          // it is important that the array values correspond to the DBS const
          // so that it can be determined which acl instance fails
          expectedValue = recursiveSort(expectedValue)

          return Promise.all([
            db.rsacl[method].apply(db.rsacl, args),
            db.rmacl[method].apply(db.rmacl, args),
            db.dsacl[method].apply(db.dsacl, args),
            db.dmacl[method].apply(db.dmacl, args)
          ])
            .then(actualValues => {
              _.forEach(actualValues, (val, key) => {
                val = recursiveSort(val)
                if (VERBOSE) {
                  let logMsg = JSON.stringify({
                    case: DBS[key],
                    expected: expectedValue === undefined ? "<UNDEFINED>" : expectedValue,
                    actual: val === undefined ? "<UNDEFINED>" : val
                  })
                  console.log(logMsg)
                }
                chai.expect(val).to.deep.equal(expectedValue)
              })
              done()
            })
        }, done)
    } catch (err) {
      done(err)
    }
  })
    .timeout(ms(options.timeout))
}

// start testing
describe('Testing node-acl-backend-rethink', () => {
  before(() => {
    // create the test databases
    return r.connect(dbHost)
      .then(conn => {
        global.connection = conn
        // create databases
        return r.expr(DBS).forEach(dbName => {
          return r.dbList().contains(dbName).branch(
            [],
            r.dbCreate(dbName)
          )
        }).run(conn)
      })
      .then(() => {
        // rethinkdb driver, single table
        db.rsacl = Promise.promisifyAll(
          new AccessControlList(new RethinkBackend(r, {
            db: R_SINGLE,
            prefix: PREFIX,
            table: TABLE,
            useSingle: true,
            ensureTable: true
          }, connection))
        )

        // rethinkdb driver, multi table
        db.rmacl = Promise.promisifyAll(
          new AccessControlList(new RethinkBackend(r, {
            db: R_MULTI,
            prefix: PREFIX,
            useSingle: false,
            ensureTable: true
          }, connection))
        )

        // rethinkdbdash driver, single table
        db.dsacl = Promise.promisifyAll(
          new AccessControlList(new RethinkBackend(d, {
            db: D_SINGLE,
            prefix: PREFIX,
            table: TABLE,
            useSingle: true,
            ensureTable: true
          }))
        )

        // rethinkdbdash driver, multi table
        db.dmacl = Promise.promisifyAll(
          new AccessControlList(new RethinkBackend(d, {
            db: D_MULTI,
            prefix: PREFIX,
            useSingle: false,
            ensureTable: true
          }))
        )
      })
  })

  // start tests of individual methods
  Test('addUserRoles', [USER1, ROLE_ADMIN])
  Test('userRoles', [USER1])
  Test('allow', [ROLE_ADMIN, [RES_A, RES_B, RES_ABC], '*'])
  Test('addRoleParents', [ROLE_USER, ROLE_PARENT])
  Test('addUserRoles', [USER2, ROLE_USER])
  Test('addUserRoles', [USER3, ROLE_USER])
  Test('allow', [ROLE_PARENT, RES_A, PERM_WRITE])
  Test('allowedPermissions', [USER2, RES_A])
  Test('roleUsers', [ROLE_USER])
  Test('hasRole', [USER1, ROLE_ADMIN])
  Test('hasRole', [USER2, ROLE_ADMIN])
  Test('whatResources', [ROLE_ADMIN])
  Test('areAnyRolesAllowed', [[ROLE_PARENT, ROLE_ADMIN], RES_ABC, PERM_WRITE])
  Test('isAllowed', [USER3, RES_B, PERM_WRITE])
  Test('isAllowed', [USER1, RES_B, PERM_WRITE])
  Test('removeResource', [RES_B])
  Test('isAllowed', [USER1, RES_B, PERM_WRITE])
  Test('removeRoleParents', [ROLE_USER, ROLE_PARENT])
  Test('isAllowed', [USER3, RES_A, PERM_WRITE])
  Test('removeAllow', [ROLE_ADMIN, RES_ABC, '*'])
  Test('isAllowed', [USER1, RES_ABC, PERM_WRITE])
  Test('hasRole', [USER3, ROLE_USER])
  Test('removeUserRoles', [USER3, ROLE_USER])
  Test('hasRole', [USER3, ROLE_USER])
  Test('hasRole', [USER1, ROLE_ADMIN])
  Test('removeRole', [ROLE_ADMIN])
  Test('hasRole', [USER1, ROLE_ADMIN])
})
