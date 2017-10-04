import * as _ from './util'
import contract from './contract'

const OMIT_FIELDS = {
  _bucketname: true,
  key: true,
  id: true
}

export default class RethinkDBACLBackend {
  constructor (r, options, connection) {
    if (_.getTypeName(options) === 'TcpConnection') {
      connection = options
      options = {}
    }
    options = options && typeof options === 'object'
      ? options
      : {}

    // user specified values
    this._r = r
    this._options = options
    this._connection = connection

    // interpreted options
    this._db = _.stringDefault(options.db, 'test')
    this._prefix = _.stringDefault(options.prefix, 'acl_')
    this._table = _.stringDefault(options.table, 'access')
    this._single = options.useSingle === true
    this._ensureTable = options.ensureTable === true
  }

  /**
   * Insert an add transaction
   * @param trx
   * @param bucket
   * @param key
   * @param values
   */
  add (trx, bucket, key, values) {
    contract(arguments).params('array', 'string', 'string|number','string|array|number').end()
    key = _.encodeText(key)
    values = _.encodeAll(values)

    let r = this._r
    let db = this._db
    let tableName = this._getTableName(bucket)
    let filter = this._keyFilter(key, bucket)

    // create an error if the key is named key
    if (key === 'key') {
      trx.ops.push(r.error('acl keys cannot be named "key"'))
      return
    }

    // construct a document to save
    let doc = values.reduce((accum, value) => {
      accum[value] = true
      return accum
    }, {})

    // add the table to the transaction
    if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName)

    // construct the operation
    let op = r.db(db).table(tableName).filter(filter).nth(0).default(null)
      .do(docs => {
        return docs.eq(null).branch(
          r.db(db).table(tableName).insert(Object.assign({}, filter, doc)),
          r.db(db).table(tableName).get(docs('id')).update(doc)
        )
          .do(summary => {
            return summary('errors').ne(0).branch(
              r.error(summary('first_error')),
              true
            )
          })
      })

    // add the operation
    trx.ops.push(op)
  }

  /**
   * Create a transaction object
   * @returns {{tables: Array, ops: Array}}
   */
  begin () {
    return {
      tables: [],
      ops: []
    }
  }

  /**
   * Removes the tables
   * @param cb
   */
  clean (cb) {
    contract(arguments).params('function').end()

    let r = this._r
    let db = this._db

    return r.db(db).tableList().filter(name => {
      let tableName = this._single
        ? `${this._prefix}${this._table}`
        : this._prefix

      return name.match(tableName ? `(?i)^${tableName}` : '.*')
    })
      .forEach(tableName => r.db(db).tableDrop(tableName))
      .run(this._connection)
      .then(() => cb(), cb)
  }

  /**
   * Deletes the given keys from the bucket
   * @param trx
   * @param bucket
   * @param keys
   */
  del (trx, bucket, keys) {
    contract(arguments).params('array', 'string', 'string|array').end()
    keys = _.encodeAll(keys)

    let r = this._r
    let db = this._db
    let tableName = this._getTableName(bucket)

    // add the table
    if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName)

    // build the operation
    let op = r.db(db).table(tableName).filter(doc => {
      return this._single
        ? r.expr(keys).contains(doc('key')).and(doc('_bucketname').eq(bucket))
        : r.expr(keys).contains(doc('key'))
    })
      .delete()
      .do(summary => {
        return summary('errors').ne(0).branch(
          r.error(summary('first_error')),
          true
        )
      })

    // add the operation to the transaction
    trx.ops.push(op)
  }

  /**
   * Performs all of the operations in the transaction
   * @param trx
   * @param cb
   */
  end (trx, cb){
    contract(arguments).params('array', 'function').end()
    let { ops, tables } = trx

    return this._enforceTables(tables).do(() => {
      return this._r.do(ops, res => res)
    })
      .run(this._connection)
      .then(() => cb(), cb)
  }

  /**
   * Gets a key from the specified bucket
   * @param bucket
   * @param key
   * @param cb
   */
  get (bucket, key, cb) {
    contract(arguments).params('string', 'string|number', 'function').end()
    key = _.encodeText(key)

    let r = this._r
    let db = this._db
    let tableName = this._getTableName(bucket)
    let filter = this._keyFilter(key, bucket)

    return this._enforceTables(tableName).do(() => {
      return r.db(db).table(tableName).filter(filter)
        .without(OMIT_FIELDS)
        .nth(0)
        .default(null)
    })
      .run(this._connection)
      .then(doc => {
        return doc
          ? cb(undefined, _.keys(_.fixKeys(doc)))
          : cb(undefined, [])
      }, cb)
  }

  /**
   * Removes a key from a specific bucket
   * @param trx
   * @param bucket
   * @param key
   * @param values
   */
  remove (trx, bucket, key, values) {
    contract(arguments).params('array', 'string', 'string|number','string|array|number').end()
    key = _.encodeText(key)
    values = _.encodeAll(values)

    let r = this._r
    let db = this._db
    let tableName = this._getTableName(bucket)
    let filter = this._keyFilter(key, bucket)

    // construct a document to save
    let doc = values.reduce((accum, value) => {
      accum[value] = true
      return accum
    }, {})

    // add the table to the transaction
    if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName)

    // build the operation
    let op = r.db(db).table(tableName)
      .filter(filter)
      .without(doc)
      .nth(0)
      .default(null)
      .do(rec => {
        return rec.eq(null).branch(
          true,
          r.db(db).table(tableName).get(rec('id')).replace(rec)
            .do(summary => {
              return summary('errors').ne(0).branch(
                r.error(summary('first_error')),
                true
              )
            })
        )
      })
  }

  /**
   *
   * @param bucket
   * @param keys
   * @param cb
   */
  union (bucket, keys, cb) {
    contract(arguments).params('string', 'array', 'function').end()
    keys = _.encodeAll(keys)

    let r = this._r
    let db = this._db
    let tableName = this._getTableName(bucket)

    return this._enforceTables(tableName).do(() => {
      return r.db(db).table(tableName).filter(doc => {
        return this._single
          ? r.expr(keys).contains(doc('key')).and(doc('_bucketname').eq(bucket))
          : r.expr(keys).contains(doc('key'))
      })
        .without(OMIT_FIELDS)
        .coerceTo('array')
    })
      .run(this._connection)
      .then(docs => {
        let res = docs.reduce((accum, doc) => {
          _.keys(_.fixKeys(doc)).forEach(key => accum.push(key))
          return accum
        }, [])

        return cb(undefined, _.union(res))
      }, cb)
  }

  /**
   * When set to ensure tables, creates tables that do not exist
   * @param tables
   * @private
   */
  _enforceTables (tables) {
    let r = this._r
    let db = this._db
    tables = Array.isArray(tables) ? tables : [tables]

    return r.expr(tables).forEach(tableName => {
      return r.db(db).tableList().contains(tableName).branch(
        [],
        r.expr(this._ensureTable).eq(true).branch(
          r.db(db).tableCreate(tableName).do(() => []),
          r.error(`table "${tableName}" has not been created on database "${db}"`)
        )
      )
    })
  }

  /**
   * Determines the table name based on the current options and bucket
   * @param bucket
   * @returns {string}
   * @private
   */
  _getTableName (bucket) {
    return `${this._prefix}${this._single ? this._table : bucket}`
  }

  /**
   * Creates a filter object to select the correct key/bucket
   * @param key
   * @param _bucketname
   * @returns {*}
   * @private
   */
  _keyFilter (key, _bucketname) {
    return this._single
      ? { key, _bucketname }
      : { key }
  }
}