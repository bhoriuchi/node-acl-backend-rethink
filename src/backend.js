/**
 RethinkDB Backend.

 Implementation of the storage backend using RethinkDB
 based off of MongoDB backend https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js
 */
import _ from 'lodash'
import contract from './contract'
import {
  getUnion,
  encodeText,
  makeArray,
  pushAdd,
  tableExists,
  selectKeys,
  hasKey
} from './utils'

function RethinkDBBackend (r, prefix = '', useSingle = false, dbName = 'test', table = 'resources') {
  this.r = r
  this.dbName = dbName
  this.prefix = prefix
  this.useSingle = Boolean(useSingle)
  this.table = table
  this.db = r.db(dbName)
}

RethinkDBBackend.prototype = {

  /**
   Begins a transaction
   */
  begin : function () {
    return []
  },

  /**
   Ends a transaction (and executes it)
   */
  end : function (trx, cb){
    contract(arguments).params('array', 'function').end()

    this.r.do(trx, (res) => {
      return res
    }).run().then(() => {
      cb()
    }).catch((err) => {
      cb(err)
    })
  },

  /**
   Cleans the whole storage.
   */
  clean : function (cb) {
    contract(arguments).params('function').end()

    return this.r.do(
      this.db.tableList().filter((name) => {
        let coll = this.useSingle ? this.prefix + this.table : this.prefix
        let rx = coll ? `(?i)^${coll}` : '.*'
        return name.match(rx)
      }),
      (list) => {
        return this.r.branch(
          list.count().gt(0),
          list.forEach((name) => {
            return this.db.tableDrop(name)
          }),
          false
        )
      }
    ).run().then(() => {
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

    return hasKey(
      this,
      key,
      bucket,
      // success
      (doc) => {
        return cb(undefined, _.without(_.keys(doc[0]),'key', 'id', '_bucketname'))
      },
      // fail
      () => {
        return cb(undefined, [])
      }
    ).catch((err) => {
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
    return this.r.expr(buckets).forEach((bucket) => {
      return getUnion(this, bucket, keys, (res) => {
        result[bucket] = res
      })
    }).run().then(() => {
      cb(undefined, result)
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

    let result = []

    return getUnion(this, bucket, keys, (res) => {
      result = res
    }).run().then(() => {
      cb(undefined, result)
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

    let collName = this.useSingle ? this.table : bucket
    let bucketName = this.prefix + collName

    if (key === 'key') throw new Error("Key name 'key' is not allowed.")
    key = encodeText(key)
    values = makeArray(values)

    return tableExists(
      this,
      bucketName,
      // true
      () => this.r.expr(pushAdd(this, trx, bucket, collName, key, values, false)),
      // false
      () => this.r.expr(pushAdd(this, trx, bucket, collName, key, values, true))
    ).run()
  },

  /**
   Delete the given key(s) at the bucket
   */
  del : function (trx, bucket, keys) {
    contract(arguments)
      .params('array', 'string', 'string|array')
      .end()

    keys = makeArray(keys)

    let collName = this.useSingle ? this.table : bucket
    let bucketName = this.prefix + collName

    return tableExists(
      this,
      bucketName,
      // true
      () => {
        trx.push(this.db.table(bucketName).filter(selectKeys(this, keys, bucket)).delete())
      },
      // false
      () => {
        throw new Error(`Table: ${bucketName} does not exist`)
      }
    )
  },

  /**
   Removes values from a given key inside a bucket.
   */
  // TODO: finish this function
  remove : function (trx, bucket, key, values) {
    contract(arguments)
      .params('array', 'string', 'string|number','string|array|number')
      .end()

    key = encodeText(key)
    values = makeArray(values)

    let collName = this.useSingle ? this.table : bucket
    let bucketName = this.prefix + collName

    trx.push(
      this.db.table(bucketName).filter(selectKey(this, key, bucket)).update()
    )
  }
}

export default RethinkDBBackend
