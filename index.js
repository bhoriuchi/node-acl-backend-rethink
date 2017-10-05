'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/**
 Design by Contract module (c) OptimalBits 2011.

 Converted to ES6 by Branden Horiuchi <bhoriuchi@gmail.com>
 
 */
var noop = {};

noop.params = function () {
  return this;
};
noop.end = function () {};

var contract = function contract(args) {
  if (contract.debug === true) {
    contract.fulfilled = false;
    contract.args = _.toArray(args);
    contract.checkedParams = [];
    return contract;
  } else {
    return noop;
  }
};

contract.params = function () {
  this.fulfilled |= checkParams(this.args, _.toArray(arguments));
  if (this.fulfilled) {
    return noop;
  } else {
    this.checkedParams.push(arguments);
    return this;
  }
};
contract.end = function () {
  if (!this.fulfilled) {
    printParamsError(this.args, this.checkedParams);
    throw new Error('Broke parameter contract');
  }
};

var typeOf = function typeOf(obj) {
  return Array.isArray(obj) ? 'array' : typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
};

var checkParams = function checkParams(args, contract) {
  var fulfilled, types, type, i, j;

  if (args.length !== contract.length) {
    return false;
  } else {
    for (i = 0; i < args.length; i++) {
      try {
        types = contract[i].split('|');
      } catch (e) {
        console.log(e, args);
      }

      type = typeOf(args[i]);
      fulfilled = false;
      for (j = 0; j < types.length; j++) {
        if (type === types[j]) {
          fulfilled = true;
          break;
        }
      }
      if (fulfilled === false) {
        return false;
      }
    }
    return true;
  }
};

var printParamsError = function printParamsError(args, checkedParams) {
  var msg = 'Parameter mismatch.\nInput:\n( ',
      type,
      input,
      i;
  _.forEach(args, function (input, key) {
    type = typeOf(input);
    if (key != 0) {
      msg += ', ';
    }
    msg += input + ': ' + type;
  });

  msg += ')\nAccepted:\n';

  for (i = 0; i < checkedParams.length; i++) {
    msg += '(' + argsToString(checkedParams[i]) + ')\n';
  }

  console.log(msg);
};

var argsToString = function argsToString(args) {
  var res = "";
  _.forEach(args, function (arg, key) {
    if (key != 0) {
      res += ', ';
    }
    res += arg;
  });
  return res;
};

function decodeAll(arrOrText) {
  return _.map(_.castArray(arrOrText), decodeText);
}

function decodeText(text) {
  return _.isString(text) ? decodeURIComponent(text) : text;
}

function encodeAll(arrOrText) {
  return _.map(_.castArray(arrOrText), encodeText);
}

function encodeText(text) {
  return _.isString(text) ? encodeURIComponent(text).replace(/\./g, '%2E') : text;
}

function getTypeName(val) {
  return _.isObject(val) && val ? val.constructor.name : null;
}

function stringDefault(val, defaultValue) {
  return _.isString(val) && val ? val : defaultValue;
}

/**
 * RethinkDB backend for ACL
 * @author Branden Horiuchi <bhoriuchi@gmail.com>
 * @liscense MIT
 */
var OMIT_FIELDS = {
  _bucketname: true,
  key: true,
  id: true
};

var RethinkDBACLBackend = function () {
  function RethinkDBACLBackend(r, options, connection) {
    classCallCheck(this, RethinkDBACLBackend);

    if (getTypeName(options) === 'TcpConnection') {
      connection = options;
      options = {};
    }
    options = options && _.isObject(options) ? options : {};

    // constructor arguments
    this._r = r;
    this._options = options;
    this._connection = connection;

    // interpreted options
    this._db = stringDefault(options.db, 'test');
    this._prefix = stringDefault(options.prefix, 'acl_');
    this._table = stringDefault(options.table, 'access');
    this._single = options.useSingle !== false; // default to use single table
    this._ensureTable = options.ensureTable !== false; // default to create tables that dont exist
  }

  /**
   * Insert an add transaction
   * @param trx
   * @param bucket
   * @param key
   * @param values
   */


  createClass(RethinkDBACLBackend, [{
    key: 'add',
    value: function add(trx, bucket, key, values) {
      contract(arguments).params('array', 'string', 'string|number', 'string|array|number').end();
      key = encodeText(key);
      values = encodeAll(values);
      bucket = this._encodeBucket(bucket);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);
      var filter = this._keyFilter(key, bucket);

      // create an error if the key is named key
      if (key === 'key') {
        trx.ops.push(r.error('acl keys cannot be named "key"'));
        return;
      }

      // construct a document to save
      var doc = values.reduce(function (accum, value) {
        accum[value] = true;
        return accum;
      }, {});

      // add the table to the transaction
      if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName);

      // construct the operation
      var op = r.db(db).table(tableName).filter(filter).nth(0).default(null).do(function (docs) {
        return docs.eq(null).branch(r.db(db).table(tableName).insert(Object.assign({}, filter, doc)), r.db(db).table(tableName).get(docs('id')).update(doc)).do(function (summary) {
          return summary('errors').ne(0).branch(r.error(summary('first_error')), true);
        });
      });

      // add the operation
      trx.ops.push(op);
    }

    /**
     * Create a transaction object
     * @returns {{tables: Array, ops: Array}}
     */

  }, {
    key: 'begin',
    value: function begin() {
      return {
        tables: [],
        ops: []
      };
    }

    /**
     * Removes the tables
     * @param cb
     */

  }, {
    key: 'clean',
    value: function clean(cb) {
      var _this = this;

      contract(arguments).params('function').end();

      var r = this._r;
      var db = this._db;

      return r.db(db).tableList().filter(function (name) {
        var tableName = _this._single ? '' + _this._prefix + _this._table : _this._prefix;

        return name.match(tableName ? '(?i)^' + tableName : '.*');
      }).forEach(function (tableName) {
        return r.db(db).tableDrop(tableName);
      }).run(this._connection).then(function () {
        return cb();
      }, cb);
    }

    /**
     * Deletes the given keys from the bucket
     * @param trx
     * @param bucket
     * @param keys
     */

  }, {
    key: 'del',
    value: function del(trx, bucket, keys) {
      var _this2 = this;

      contract(arguments).params('array', 'string', 'string|array').end();
      keys = encodeAll(keys);
      bucket = this._encodeBucket(bucket);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);

      // add the table
      if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName);

      // build the operation
      var op = r.db(db).table(tableName).filter(function (doc) {
        return _this2._single ? r.expr(keys).contains(doc('key')).and(doc('_bucketname').eq(bucket)) : r.expr(keys).contains(doc('key'));
      }).delete().do(function (summary) {
        return summary('errors').ne(0).branch(r.error(summary('first_error')), true);
      });

      // add the operation to the transaction
      trx.ops.push(op);
    }

    /**
     * Performs all of the operations in the transaction
     * @param trx
     * @param cb
     */

  }, {
    key: 'end',
    value: function end(trx, cb) {
      var _this3 = this;

      contract(arguments).params('array', 'function').end();
      var ops = trx.ops,
          tables = trx.tables;


      return this._enforceTables(tables).do(function () {
        return _this3._r.do(ops, function (res) {
          return res;
        });
      }).run(this._connection).then(function () {
        return cb();
      }, cb);
    }

    /**
     * Gets a key from the specified bucket
     * @param bucket
     * @param key
     * @param cb
     */

  }, {
    key: 'get',
    value: function get$$1(bucket, key, cb) {
      contract(arguments).params('string', 'string|number', 'function').end();
      key = encodeText(key);
      bucket = this._encodeBucket(bucket);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);
      var filter = this._keyFilter(key, bucket);

      return this._enforceTables(tableName).do(function () {
        return r.db(db).table(tableName).filter(filter).without(OMIT_FIELDS).nth(0).default({}).keys();
      }).run(this._connection).then(function (res) {
        return cb(undefined, decodeAll(res));
      }, cb);
    }

    /**
     * Removes a key from a specific bucket
     * @param trx
     * @param bucket
     * @param key
     * @param values
     */

  }, {
    key: 'remove',
    value: function remove(trx, bucket, key, values) {
      contract(arguments).params('array', 'string', 'string|number', 'string|array|number').end();
      key = encodeText(key);
      values = encodeAll(values);
      bucket = this._encodeBucket(bucket);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);
      var filter = this._keyFilter(key, bucket);

      // construct a document to save
      var doc = values.reduce(function (accum, value) {
        accum[value] = true;
        return accum;
      }, {});

      // add the table to the transaction
      if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName);

      // build the operation
      var op = r.db(db).table(tableName).filter(filter).without(doc).nth(0).default(null).do(function (rec) {
        return rec.eq(null).branch(true, r.db(db).table(tableName).get(rec('id')).replace(rec).do(function (summary) {
          return summary('errors').ne(0).branch(r.error(summary('first_error')), true);
        }));
      });

      // add the operation to the transaction
      trx.ops.push(op);
    }

    /**
     * Returns the union of the values in the given keys
     * @param bucket
     * @param keys
     * @param cb
     */

  }, {
    key: 'union',
    value: function union(bucket, keys, cb) {
      var _this4 = this;

      contract(arguments).params('string', 'array', 'function').end();
      keys = encodeAll(keys);
      bucket = this._encodeBucket(bucket);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);

      return this._enforceTables(tableName).do(function () {
        return r.db(db).table(tableName).filter(function (doc) {
          return _this4._single ? r.expr(keys).contains(doc('key')).and(doc('_bucketname').eq(bucket)) : r.expr(keys).contains(doc('key'));
        }).without(OMIT_FIELDS).coerceTo('array').prepend([]).reduce(function (accum, cur) {
          return accum.union(cur.keys().default([]));
        });
      }).run(this._connection).then(function (res) {
        return cb(undefined, decodeAll(res));
      }, cb);
    }

    /**
     * Gets the union of the keys in each of the specified buckets
     * @param buckets
     * @param keys
     * @param cb
     * @returns {*}
     */

  }, {
    key: 'unions',
    value: function unions(buckets, keys, cb) {
      var _this5 = this;

      contract(arguments).params('array', 'array', 'function').end();
      keys = encodeAll(keys);
      buckets = _.map(buckets, function (bucket) {
        return _this5._encodeBucket(bucket);
      });

      var r = this._r;
      var db = this._db;

      // get table names
      var tables = this._single ? this._getTableName('') : _.map(buckets, function (bucket) {
        return _this5._getTableName(bucket);
      });

      return this._enforceTables(tables).do(function () {
        return r.expr(buckets).map(function (bucket) {
          return {
            bucket: bucket,
            unions: r.db(db).table(_this5._getTableNameReQL(bucket)).filter(function (doc) {
              return _this5._single ? r.expr(keys).contains(doc('key')).and(doc('_bucketname').eq(bucket)) : r.expr(keys).contains(doc('key'));
            }).without(OMIT_FIELDS).coerceTo('array').prepend([]).reduce(function (accum, cur) {
              return accum.union(cur.keys().default([]));
            })
          };
        });
      }).run(this._connection).then(function (res) {
        var results = _.reduce(res, function (accum, _ref) {
          var bucket = _ref.bucket,
              unions = _ref.unions;

          accum[bucket] = decodeAll(unions);
          return accum;
        }, {});

        cb(undefined, results);
      }, cb);
    }

    /**
     * Encodes a bucket name using hex when not using single table option
     * and not matching /A-Za-z0-9_/. This will use only alphanumeric to meet the
     * table name requirement. This way Buckets can contain special characters
     * @param bucket
     * @returns {String}
     * @private
     */

  }, {
    key: '_encodeBucket',
    value: function _encodeBucket(bucket) {
      return this._single ? bucket : bucket.match(/[^A-Za-z0-9_]/) ? new Buffer(bucket).toString('hex') : bucket;
    }

    /**
     * When set to ensure tables, creates tables that do not exist
     * @param tables
     * @private
     */

  }, {
    key: '_enforceTables',
    value: function _enforceTables(tables) {
      var _this6 = this;

      var r = this._r;
      var db = this._db;
      tables = Array.isArray(tables) ? tables : [tables];

      return r.expr(tables).forEach(function (tableName) {
        return r.db(db).tableList().contains(tableName).branch([], r.expr(_this6._ensureTable).eq(true).branch(r.db(db).tableCreate(tableName).do(function () {
          return [];
        }), r.error('table "' + tableName + '" has not been created on database "' + db + '"')));
      });
    }

    /**
     * Determines the table name based on the current options and bucket
     * @param bucket
     * @returns {string}
     * @private
     */

  }, {
    key: '_getTableName',
    value: function _getTableName(bucket) {
      return '' + this._prefix + (this._single ? this._table : bucket);
    }

    /**
     * Determines the table name based on the current options and bucket using ReQL
     * @param bucket
     * @private
     */

  }, {
    key: '_getTableNameReQL',
    value: function _getTableNameReQL(bucket) {
      return this._r.expr(this._single).branch(this._r.expr(this._prefix).add(this._table), this._r.expr(this._prefix).add(bucket));
    }

    /**
     * Creates a filter object to select the correct key/bucket
     * @param key
     * @param _bucketname
     * @returns {*}
     * @private
     */

  }, {
    key: '_keyFilter',
    value: function _keyFilter(key, _bucketname) {
      return this._single ? { key: key, _bucketname: _bucketname } : { key: key };
    }
  }]);
  return RethinkDBACLBackend;
}();

module.exports = RethinkDBACLBackend;
