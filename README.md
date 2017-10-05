# acl-backend-rethinkdb
RethinkDB backend for [`acl`](https://github.com/optimalbits/node_acl) that 
works with both [`rethinkdb`](https://github.com/rethinkdb/rethinkdb) 
and [`rethinkdbdash`](https://github.com/neumino/rethinkdbdash) drivers

### Using [`rethinkdbdash`](https://github.com/neumino/rethinkdbdash) driver

This driver takes care of creating the connection for the user so usage is 
more straightforward

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

Since the official rethinkdb driver requires a connection to be passed to 
the `run` method, the connection parameter is required for the backend to function

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
  * [`useSingle=true`] { `Boolean` } - Use a single table for storing data when `true`
  * [`ensureTable=true`] { `Boolean` } - Creates a table if it does not exist 
  when `true`. Should be `true` when `useSingle=false` since bucket/table names are
  created based on resource names
* [`connection`] { `Object` } - Database connection object. Required for `rethinkdb` 
driver and not used by `rethinkdbdash` driver

### Notes

* When `useSingle=false` is set buckets not matching `/A-Za-z0-9_/` will have their 
bucket/table name names encoded with their hex value. This allows any character to be used
for the bucket name without violating RethinkDB's table naming constraint.
