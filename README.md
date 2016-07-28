# acl-backend-rethinkdb
RethinkDB backend for [`acl`](https://github.com/optimalbits/node_acl) that works with both [`rethinkdb`](https://github.com/rethinkdb/rethinkdb) and [`rethinkdbdash`](https://github.com/neumino/rethinkdbdash) (preferred)

### Using [`rethinkdbdash`](https://github.com/neumino/rethinkdbdash)
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

### Using [`rethinkdb`](https://github.com/rethinkdb/rethinkdb)

```
var acl = require('acl')
var r = require('rethinkdb')
var RethinkDBBackend = require('acl-backend-rethinkdb')

r.connect({}).then(function (connection) {
  var options = {
    prefix: 'acl_',
    useSingle: true,
    ensureTable: true,
    connection: connection // required for rethinkdb driver
  }

  acl = new acl(new RethinkDBBackend(r, options))
  acl.addUserRoles('john', 'admin', function(err) {
   ...
  })
})
```

### API

##### `RethinkDBBackend` ( `rethink`, `options` )

* `rethink` { `Object` } - RethinkDB instance
* `options` { `Object` }
  * [`db="test"`] { `String` } - Database name
  * [`prefix="acl_"`] { `String` } - Prefix for table names
  * [`useSingle=false`] { `Boolean` } - Use a single table for storing data when `true`
  * [`table="resources"`] { `String` } - Table name for useSingle
  * [`ensureTable=false`] { `Boolean` } - Creates a table if it does not exist when `true`
  * `connection` { `Object` } - Database connection object. Required for `rethinkdb` driver


