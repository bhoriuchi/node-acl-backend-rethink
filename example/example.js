require('babel-register')
var acl = require('acl')
var rethinkdbdash = require('rethinkdbdash')
var RethinkDBBackend = require('../src/backend').default
var r = rethinkdbdash()
var rdb = require('rethinkdb')

var opts = {
  prefix: 'acl_',
  useSingle: true,
  ensureTable: true
}

var dash = true

if (dash) {
  // rethinkdbdash backend
  testIt(new RethinkDBBackend(r, opts))
} else {
// rethinkdb backend
  rdb.connect({}).then(function (connection) {
    opts.connection = connection
    testIt(new RethinkDBBackend(rdb, opts))
  })
}

// generic callback function for debugging
function cb (from) {
  from = from || 'INFO'
  return function (err, success) {
    if (err) console.error(from, '-', 'ERROR:', err)
    else console.log(from, '-', 'SUCCESS:', success)
    process.exit()
  }
}

function testIt (backend) {
// new acl instance
  acl = new acl(backend)
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

