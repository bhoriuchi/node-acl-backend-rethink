/**
 RethinkDB Backend.

 Implementation of the storage backend using RethinkDB
 based off of MongoDB backend https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js

 Author: Branden Horiuchi <bhoriuchi@gmail.com>
 */
import _ from './litedash'
import contract from './contract'
import {
  encodeText,
  makeArray,
  selectKey,
  selectKeys,
  getTable,
  pushUniq,
  fixAllKeys,
  ensureTable
} from './utils'

const OMIT_FIELDS = { _bucketname: true, key: true, id: true }

function RethinkDBBackend (r, opts, connection) {
  opts = _.isHash(opts) ? opts : {}
  this.r = r
  this.db = opts.db || 'test'
  this.prefix = opts.prefix || ''
  this.useSingle = Boolean(opts.useSingle)
  this.table = opts.table || 'resources'
  this.ensureTable = Boolean(opts.ensureTable)
  this.connection = connection
  this._dbc = this.r.db(this.db)
}

RethinkDBBackend.prototype = {

  /**
   Begins a transaction
   */
  begin : function () {
    return { tables: [],  ops: [] }
  },

  /**
   Ends a transaction (and executes it)
   */
  end : function (trx, cb){
    contract(arguments).params('array', 'function').end()

    let exec = () => {
      return this.r.do(trx.ops, (res) => {
        return res
      }).run(this.connection).then(() => {
        cb()
      }).catch((err) => {
        cb(err)
      })
    }

    this.ensureTable ? ensureTable(this, trx.tables, exec, cb) : exec()
  },

  /**
   Cleans the whole storage.
   */
  clean : function (cb) {
    contract(arguments).params('function').end()

    return this._dbc.tableList().filter((name) => {
      let coll = this.useSingle ? this.prefix + this.table : this.prefix
      let rx = coll ? `(?i)^${coll}` : '.*'
      return name.match(rx)
    }).forEach((name) => {
      return this._dbc.tableDrop(name)
    }).run(this.connection).then(() => {
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

    let t = getTable(this, bucket)
    let filter = selectKey(this, key, bucket)

    let exec = () => {
      let query = t.table.filter(filter).without(OMIT_FIELDS).coerceTo('array')
      return query.run(this.connection).then((docs) => {
        if (docs.length) return cb(null, _.keys(docs[0]))
        cb(null, [])
      }).catch((err) => {
        cb(err)
      })
    }

    this.ensureTable ? ensureTable(this, t.name, exec, cb) : exec()
  },

  /**
   * UN-TESTED
   Gets an object mapping each passed bucket to the union of the specified keys inside that bucket.
   */
  unions : function (buckets, keys, cb) {
    contract(arguments)
      .params('array', 'array', 'function')
      .end()

    let result = {}

    return this.r.expr(buckets).map((bucket) => {
      let t = getTable(this, bucket)
      let filter = selectKeys(this, keys, bucket)
      return t.table.filter(filter).without(OMIT_FIELDS)
    }).coerceTo('array').run(this.connection).then((results) => {
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
    let t = getTable(this, bucket)
    let filter = selectKeys(this, keys, bucket)
    let query = t.table.filter(filter).without(OMIT_FIELDS).coerceTo('array')

    return query.run(this.connection).then((docs) => {
      if (!docs.length) return cb(null, [])
      fixAllKeys(docs).forEach((doc) => { keyArrays.push.apply(keyArrays, _.keys(doc)) })
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
    let t = getTable(this, bucket)
    let filter = selectKey(this, key, bucket)

    values = makeArray(values)
    values.forEach((value) => { doc[value] = true })
    pushUniq(t.name, trx.tables)

    trx.ops.push(
      this.r.do(
        t.table.filter(filter).coerceTo('array'),
        (docs) => {
          return this.r.branch(
            docs.count().gt(0).coerceTo('bool'),
            t.table.get(docs.nth(0)('id')).update(doc),
            t.table.insert(Object.assign({}, filter, doc))
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

    let t = getTable(this, bucket)
    let filter = selectKeys(this, keys, bucket)

    pushUniq(t.name, trx.tables)

    trx.ops.push(
      this.r.do(
        t.table.filter(filter).coerceTo('array'),
        (docs) => {
          return this.r.branch(
            docs.count().gt(0).coerceTo('bool'),
            t.table.filter(filter).delete(),
            []
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
    let t = getTable(this, bucket)
    let filter = selectKey(this, key, bucket)

    values = makeArray(values)
    values.forEach((value) => { doc[value] = true })
    pushUniq(t.name, trx.tables)

    trx.ops.push(
      this.r.do(
        t.table.filter(filter).without(doc).coerceTo('array'),
        (docs) => {
          return this.r.branch(
            docs.count().gt(0).coerceTo('bool'),
            t.table.get(docs.nth(0)('id')).replace(docs.nth(0)),
            []
          )
        }
      )
    )
  }
}

export default RethinkDBBackend
