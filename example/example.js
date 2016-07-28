require('babel-register')
var Promise = require('bluebird')
var acl = require('acl')
var rethinkdbdash = require('rethinkdbdash')
var RethinkDBBackend = require('../src/backend').default
var r = rethinkdbdash()
var rdb = require('rethinkdb')
var _ = require('lodash')

var currentTest = ''
var opts = {
  prefix: 'acl_',
  useSingle: true,
  ensureTable: true
}

var dash = false
var fullTest = true

if (dash) {
  // rethinkdbdash backend
  testIt(new RethinkDBBackend(r, opts))
} else {
// rethinkdb backend
  rdb.connect({}).then(function (connection) {
    testIt(new RethinkDBBackend(rdb, opts, connection))
  })
}

// generic callback function for debugging
function cb (from) {
  from = from || 'INFO'
  return function (err, success) {
    if (err) console.error(from, '-', 'ERROR:', err)
    else console.log(from, '-', 'SUCCESS:', success)
  }
}

function testIt (backend) {
  // new acl instance, promisified to avoid callback hell
  acl = Promise.promisifyAll(new acl(backend))

  if (fullTest) {
    console.log('-- RUNNING FULL TEST -- ')
    currentTest = 'clean'
    acl.backend.clean(function (err) {

      if (err) throw err
      currentTest = 'addUserRoles'
      acl.addUserRolesAsync('john', 'admin').then(function () {

        console.log('SUCCESS:', currentTest)
        currentTest = 'hasRole'
        return acl.hasRoleAsync('john', 'admin')

      }).then(function (hasRole) {

        hasRole ? console.log('SUCCESS:', currentTest) : console.log('FAILED:', currentTest)
        currentTest = 'allow'
        return acl.allowAsync('admin', 'testResource', 'write')

      }).then(function () {

        console.log('SUCCESS:', currentTest)
        currentTest = 'isAllowed'
        return acl.isAllowed('john', 'testResource', 'write')

      }).then(function (isAllowed) {

        isAllowed ? console.log('SUCCESS:', currentTest) : console.log('FAILED:', currentTest)
        currentTest = 'allowedPermissions'
        return acl.allowedPermissionsAsync('john', 'testResource')

      }).then(function (permissions) {

        var success = _.get(permissions, 'testResource[0]') === 'write'
        success ? console.log('SUCCESS:', currentTest, '-', permissions) : console.log('FAILED:', currentTest)
        currentTest = 'removeAllow'
        return acl.removeAllow('admin', 'testResource', 'write')

      }).then(function () {

        console.log('SUCCESS:', currentTest)
        currentTest = 'allowedPermissions'
        return acl.allowedPermissionsAsync('john', 'testResource')

      }).then(function (permissions) {

        var p = _.get(permissions, 'testResource')
        var success = _.isArray(p) && !p.length
        success ? console.log('SUCCESS:', currentTest, '-', permissions) : console.log('FAIL', currentTest)
        currentTest = 'addRoleParents'
        return acl.addRoleParents('regularUSER', 'admin')

      }).then(function () {

        console.log('SUCCESS:', currentTest)
        currentTest = 'removeRoleParents'
        return acl.removeRoleParents('regularUSER')

      }).then(function () {

        console.log('SUCCESS:', currentTest)

      }).then(function () {

        process.exit()

      }).catch(function (err) {

        console.error('FAIL:', currentTest, err)
        process.exit()

      })
    })
  } else {

    // acl.backend.clean(cb('CLEAN'))
    // acl.addUserRoles('john', 'admin', cb('ADD_USER_ROLE'))
    // acl.hasRole('john', 'admin', cb('HAS_ROLE'))
    // acl.allow('admin', 'testResource', 'write', cb('ALLOW'))
    // acl.isAllowed('john', 'testResource', 'write', cb('IS_ALLOWED'))
    // acl.removeAllow('admin', 'testResource', 'write', cb('REMOVE_ALLOW'))
    // acl.allowedPermissions('john', 'testResource', cb('ALLOWED_PERMISSIONS'))
    // acl.addRoleParents('regularUSER', 'admin', cb('ADD_ROLE_PARENTS'))
    // acl.removeRoleParents('regularUSER', cb('REMOVE_ROLE_PARENTS'))

    process.exit()
  }
}

