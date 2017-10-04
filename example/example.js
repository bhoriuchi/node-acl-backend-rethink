require('babel-register')
var Promise = require('bluebird')
var acl = require('acl')
var rethinkdbdash = require('rethinkdbdash')
var RethinkDBBackend = require('../src/archive/backend').default
// var RethinkDBBackend = require('../index')
var r = rethinkdbdash()
var rdb = require('rethinkdb')
var _ = require('lodash')

var currentTest = ''
var opts = {
  prefix: 'acl_',
  useSingle: true,
  ensureTable: true
}

var dash = true
var testToRun = 'full'

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
  testToRun = testToRun || 'full'

  console.log('-- RUNNING', testToRun, 'TEST -- ')

  // new acl instance, promisified to avoid callback hell
  acl = Promise.promisifyAll(new acl(backend))

  switch (testToRun) {

    case 'full':
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
          return acl.isAllowedAsync('john', 'testResource', 'write')

        }).then(function (isAllowed) {

          isAllowed ? console.log('SUCCESS:', currentTest) : console.log('FAILED:', currentTest)
          currentTest = 'allowedPermissions'
          return acl.allowedPermissionsAsync('john', 'testResource')

        }).then(function (permissions) {

          var success = _.get(permissions, 'testResource[0]') === 'write'
          success ? console.log('SUCCESS:', currentTest, '-', permissions) : console.log('FAILED:', currentTest)
          currentTest = 'removeAllow'
          return acl.removeAllowAsync('admin', 'testResource', 'write')

        }).then(function () {

          console.log('SUCCESS:', currentTest)
          currentTest = 'allowedPermissions'
          return acl.allowedPermissionsAsync('john', 'testResource')

        }).then(function (permissions) {

          var p = _.get(permissions, 'testResource')
          var success = _.isArray(p) && !p.length
          success ? console.log('SUCCESS:', currentTest, '-', permissions) : console.log('FAIL', currentTest)
          currentTest = 'addRoleParents'
          return acl.addRoleParentsAsync('regularUSER', 'admin')

        }).then(function () {

          console.log('SUCCESS:', currentTest)
          currentTest = 'removeRoleParents'
          return acl.removeRoleParentsAsync('regularUSER')

        }).then(function () {

          console.log('SUCCESS:', currentTest)

        }).then(function () {

          process.exit()

        }).catch(function (err) {

          console.error('FAIL:', currentTest, err)
          process.exit()

        })
      })

      break

    case 'breakit':
      currentTest = 'clean'
      acl.backend.clean(function (err) {
        if (err) throw err
        currentTest = 'isAllowedAsync'
        acl[currentTest]('john', 'testResource', 'write').then(function (res) {
          console.log('SUCCESS:', currentTest, res)
          process.exit()
        }).catch(function (err) {
          console.error('FAIL:', currentTest, err)
          process.exit()
        })
      })

      break

    default:
      process.exit()
  }


// acl.backend.clean(cb('CLEAN'))
// acl.addUserRoles('john', 'admin', cb('ADD_USER_ROLE'))
// acl.hasRole('john', 'admin', cb('HAS_ROLE'))
// acl.allow('admin', 'testResource', 'write', cb('ALLOW'))
// acl.isAllowed('john', 'testResource', 'write', cb('IS_ALLOWED'))
// acl.removeAllow('admin', 'testResource', 'write', cb('REMOVE_ALLOW'))
// acl.allowedPermissions('john', 'testResource', cb('ALLOWED_PERMISSIONS'))
// acl.addRoleParents('regularUSER', 'admin', cb('ADD_ROLE_PARENTS'))
// acl.removeRoleParents('regularUSER', cb('REMOVE_ROLE_PARENTS'))

}

