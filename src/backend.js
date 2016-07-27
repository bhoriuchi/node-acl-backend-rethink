/**
 RethinkDB Backend.

 Implementation of the storage backend using RethinkDB
 based off of MongoDB backend https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js
 */
import _ from './litedash'
import contract from './contract'
import {
  encodeText,
  makeArray,
  selectKey,
  selectKeys,
  getTableName,
  pushUniq,
  fixAllKeys
} from './utils'

const REMOVE_FIELDS = ['key', 'id', '_bucketname']

function RethinkDBBackend (r, opts) {
  opts = _.isHash(opts) ? opts : {}
  this.r = r
  this.dbName = opts.dbName || 'test'
  this.prefix = opts.prefix || ''
  this.useSingle = Boolean(opts.useSingle)
  this.table = opts.table || 'resources'
  this.ensureTable = Boolean(opts.ensureTable)
  this.db = this.r.db(this.dbName)
}

RethinkDBBackend.prototype = {

  /**
   Begins a transaction
   */
  begin : function () {
    return {
      tables: [],
      ops: []
    }
  },

  /**
   Ends a transaction (and executes it)
   */
  end : function (trx, cb){
    contract(arguments).params('array', 'function').end()

    let exec = () => {
      return this.r.do(trx.ops, (res) => {
        return res
      }).run().then(() => {
        cb()
      }).catch((err) => {
        cb(err)
      })
    }

    let ensureTable = () => {
      return this.r.do(
        this.db.tableList(),
        (list) => {
          return this.r.expr(trx.tables).forEach((name) => {
            return this.r.branch(
              list.contains(name).not(),
              this.db.tableCreate(name),
              []
            )
          })
        }
      ).run().then(exec).catch((err) => {
        cb(err)
      })
    }

    this.ensureTable ? ensureTable() : exec()
  },

  /**
   Cleans the whole storage.
   */
  clean : function (cb) {
    contract(arguments).params('function').end()

    return this.db.tableList().filter((name) => {
      let coll = this.useSingle ? this.prefix + this.table : this.prefix
      let rx = coll ? `(?i)^${coll}` : '.*'
      return name.match(rx)
    }).forEach((name) => {
      return this.db.tableDrop(name)
    }).run().then(() => {
      cb()
    }).catch((err) => {
      cb(err)
    })
  },

  /**
   Gets the contents at the bucket's key.
   */
  get : function (bucket, key, cb) {
    contract(arguments)
      .params('string', 'string|number', 'function')
      .end()

    let table = this.db.table(getTableName(this, bucket))
    let filter = selectKey(this, key, bucket)

    return table.filter(filter).run().then((docs) => {
      if (docs.length) return cb(null, _.keys(_.omit(docs[0], REMOVE_FIELDS)))
      cb(null, [])
    }).catch((err) => {
      cb(err)
    })
  },

  /**
   Gets an object mapping each passed bucket to the union of the specified keys inside that bucket.
   */
  unions : function (buckets, keys, cb) {
    contract(arguments)
      .params('array', 'array', 'function')
      .end()

    let result = {}
    let omitFields = { _bucketname: true, key: true, id: true }

    return this.r.expr(buckets).map((bucket) => {
      let tableName = this.prefix + (this.useSingle ? this.table : bucket)
      let table = this.db.table(tableName)
      let filter = selectKeys(this, keys, bucket)
      return table.filter(filter).without(omitFields)
    }).run().then((results) => {
      _.forEach(buckets, (name, idx) => {
        let docs = results[idx]
        if (!docs.length) {
          result[name] = []
        } else {
          let keyArrays = []
          fixAllKeys(docs).forEach((doc) => {
            keyArrays.push.apply(keyArrays, _.keys(doc))
          })
          result[name] = _.union(keyArrays)
        }
      })
      cb(null, result)
    }).catch((err) => {
      cb(err)
    })
  },

  /**
   Returns the union of the values in the given keys.
   */
  union : function (bucket, keys, cb) {
    contract(arguments)
      .params('string', 'array', 'function')
      .end()

    keys = makeArray(keys)

    let keyArrays = []
    let tableName = this.prefix + (this.useSingle ? this.table : bucket)
    let table = this.db.table(tableName)
    let filter = selectKeys(this, keys, bucket)
    let omitFields = { _bucketname: true, key: true, id: true }

    return table.filter(filter).without(omitFields).run().then((docs) => {
      if (!docs.length) return cb(null, [])

      fixAllKeys(docs).forEach((doc) => {
        keyArrays.push.apply(keyArrays, _.keys(doc))
      })
      cb(null, _.union(keyArrays))
    }).catch((err) => {
      cb(err)
    })
  },

  /**
   Adds values to a given key inside a bucket.
   */
  add : function (trx, bucket, key, values) {
    contract(arguments)
      .params('array', 'string', 'string|number','string|array|number')
      .end()

    if (key === 'key') throw new Error("Key name 'key' is not allowed.")
    key = encodeText(key)

    let doc = {}
    let tableName = this.prefix + (this.useSingle ? this.table : bucket)
    let table = this.db.table(tableName)
    let filter = selectKey(this, key, bucket)

    values = makeArray(values)
    values.forEach((value) => { doc[value] = true })
    pushUniq(tableName, trx.tables)

    trx.ops.push(
      this.r.do(
        table.filter(filter).coerceTo('array'),
        (docs) => {
          return this.r.branch(
            docs.count().gt(0).coerceTo('bool'),
            table.get(docs.nth(0)('id')).update(doc),
            table.insert(Object.assign({}, filter, doc))
          )
        }
      )
    )
  },

  /**
   Delete the given key(s) at the bucket
   */
  del : function (trx, bucket, keys) {
    contract(arguments)
      .params('array', 'string', 'string|array')
      .end()

    keys = makeArray(keys)

    let tableName = this.prefix + (this.useSingle ? this.table : bucket)
    let table = this.db.table(tableName)
    let filter = selectKeys(this, keys, bucket)

    pushUniq(tableName, trx.tables)

    trx.ops.push(
      this.r.do(
        table.filter(filter).coerceTo('array'),
        (docs) => {
          return this.r.branch(
            docs.count().gt(0).coerceTo('bool'),
            table.filter(filter).delete(),
            () => false
          )
        }
      )
    )
  },

  /**
   Removes values from a given key inside a bucket.
   */
  remove : function (trx, bucket, key, values) {
    contract(arguments)
      .params('array', 'string', 'string|number','string|array|number')
      .end()

    key = encodeText(key)

    let doc = {}
    let tableName = this.prefix + (this.useSingle ? this.table : bucket)
    let table = this.db.table(tableName)
    let filter = selectKey(this, key, bucket)

    values = makeArray(values)
    values.forEach((value) => { doc[value] = true })
    pushUniq(tableName, trx.tables)

    trx.ops.push(
      this.r.do(
        table.filter(filter).without(doc).coerceTo('array'),
        (docs) => {
          return this.r.branch(
            docs.count().gt(0).coerceTo('bool'),
            table.get(docs.nth(0)('id')).replace(docs.nth(0)),
            () => false
          )
        }
      )
    )
  }
}

export default RethinkDBBackend
