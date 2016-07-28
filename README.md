# acl-backend-rethinkdb
RethinkDB backend for [`acl`](https://github.com/optimalbits/node_acl) that works with both [`rethinkdb`](https://github.com/rethinkdb/rethinkdb) and [`rethinkdbdash`](https://github.com/neumino/rethinkdbdash) (preferred) drivers

Tested with
* `acl@0.4.9`
* `rethinkdbdash@2.3.19`
* `rethinkdb@2.3.2`

### Using [`rethinkdbdash`](https://github.com/neumino/rethinkdbdash) driver

This driver takes care of creating the connection for the user so usage is more straightforward

```
var acl = require('acl')
var r = require('rethinkdbdash')()
var RethinkDBBackend = require('acl-backend-rethinkdb')

var options = {
  prefix: 'acl_',
  useSingle: true,
  ensureTable: true
}

acl = new acl(new RethinkDBBackend(r, options))
acl.addUserRoles('john', 'admin', function(err) {
 ...
})
```

### Using [`rethinkdb`](https://github.com/rethinkdb/rethinkdb) driver

Since the official rethinkdb driver requires a connection to be passed to the `run` method, the connection parameter is required for the backend to function

```
var acl = require('acl')
var r = require('rethinkdb')
var RethinkDBBackend = require('acl-backend-rethinkdb')

r.connect({}).then(function (connection) {
  var options = {
    prefix: 'acl_',
    useSingle: true,
    ensureTable: true
  }

  acl = new acl(new RethinkDBBackend(r, options, connection))
  acl.addUserRoles('john', 'admin', function(err) {
   ...
  })
})
```

### API

##### `RethinkDBBackend` ( `rethink`, [ `options` ], [ `connection` ] )

* `rethink` { `Object` } - RethinkDB instance
* `options` { `Object` }
  * [`db="test"`] { `String` } - Database name
  * [`prefix="acl_"`] { `String` } - Prefix for table names
  * [`table="resources"`] { `String` } - Table name for useSingle
  * [`useSingle=false`] { `Boolean` } - Use a single table for storing data when `true`
  * [`ensureTable=false`] { `Boolean` } - Creates a table if it does not exist when `true`. For performance, this option should only be used in dev. In prod the core tables should be created before calling `acl` functions
* [`connection`] { `Object` } - Database connection object. Required for `rethinkdb` driver and not used by `rethinkdbdash` driver


