require('babel-register')
var acl = require('acl')
var rethinkdbdash = require('rethinkdbdash')
var RethinkDBBackend = require('../src/backend').default
var r = rethinkdbdash()

var opts = {
  prefix: 'acl_',
  useSingle: true,
  ensureTable: true
}

acl = new acl(new RethinkDBBackend(r, opts))

// generic callback function for debugging
var cb = function (from) {
  from = from || 'INFO'
  return function (err, success) {
    if (err) console.error(from, '-', 'ERROR:', err)
    else console.log(from, '-', 'SUCCESS:', success)
    process.exit()
  }
}

// acl.backend.clean(cb('CLEAN'))
// acl.addUserRoles('john', 'admin', cb('ADD_USER_ROLE'))
// acl.hasRole('john', 'admin', cb('HAS_ROLE'))
// acl.allow('admin', 'mimsResource', 'write', cb('ALLOW'))
// acl.removeAllow('admin', 'mimsResource', 'write', cb('REMOVE_ALLOW'))
// acl.addRoleParents('regularUSER', 'admin', cb('ADD_ROLE_PARENTS'))
// acl.removeRoleParents('regularUSER', cb('REMOVE_ROLE_PARENTS'))
acl.allowedPermissions('branden', 'mimsResource', cb('ALLOWED_PERMISSIONS'))
// acl.isAllowed('branden', 'mimsResource', 'write', cb('IS_ALLOWED'))