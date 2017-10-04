'use strict';

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









































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

function getTypeName(val) {
  return val && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' ? val.constructor.name : null;
}

function stringDefault(val, defaultValue) {
  return val && typeof val === 'string' ? val : defaultValue;
}

/* start https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js */
function encodeText(text) {
  if (typeof text == 'string' || text instanceof String) {
    text = encodeURIComponent(text);
    text = text.replace(/\./g, '%2E');
  }
  return text;
}

function decodeText(text) {
  if (typeof text == 'string' || text instanceof String) {
    text = decodeURIComponent(text);
  }
  return text;
}

function encodeAll(arrOrText) {
  return Array.isArray(arrOrText) ? arrOrText.map(function (item) {
    return encodeText(item);
  }) : [encodeText(arrOrText)];
}

function fixKeys(doc) {
  if (doc) {
    var ret = {};
    for (var key in doc) {
      if (doc.hasOwnProperty(key)) {
        ret[decodeText(key)] = doc[key];
      }
    }
    return ret;
  }
  return doc;
}

function union() {
  var args = [].concat(Array.prototype.slice.call(arguments));
  if (!args.length) return [];

  try {
    var u = args.reduce(function (prev, cur) {
      if (!Array.isArray(prev) || !Array.isArray(cur)) return [];
      return prev.concat(cur);
    }, []);

    return [].concat(toConsumableArray(new Set(u)));
  } catch (err) {
    return [];
  }
}

function range(n) {
  return new Array(n).fill(null).reduce(function (accum, val, idx) {
    accum.push(idx);
    return accum;
  }, []);
}

function keys(obj) {
  try {
    return Array.isArray(obj) ? range(obj.length) : Object.keys(obj);
  } catch (err) {
    return [];
  }
}

/*

  Lite version of several lodash functions.
  May not all work exactly the same as lodash in all situations

  Author: Branden Horiuchi <bhoriuchi@gmail.com>

*/

function isFunction(obj) {
  return typeof obj === 'function';
}

function isString(obj) {
  return typeof obj === 'string';
}

function isNumber(obj) {
  return typeof obj === 'number';
}

function isArray(obj) {
  return Array.isArray(obj);
}

function ensureArray(obj) {
  return !obj ? [] : isArray(obj) ? obj : [obj];
}

function isBoolean(obj) {
  return typeof obj === 'boolean';
}

function isDate(obj) {
  return obj instanceof Date;
}

function isObject(obj) {
  return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null;
}

function isHash(obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null;
}
function toString(obj) {
  try {
    if (isHash(obj) || isArray(obj)) return JSON.stringify(obj);else if (has(obj, 'toString')) return obj.toString();else return String(obj);
  } catch (err) {}
  return '';
}

function keys$1(obj) {
  try {
    return Object.keys(obj);
  } catch (err) {
    return [];
  }
}

function forEach(obj, fn) {
  try {
    if (isArray(obj)) {
      var idx = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = obj[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var val = _step.value;

          if (fn(val, idx) === false) break;
          idx++;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    } else {
      for (var key in obj) {
        if (fn(obj[key], key) === false) break;
      }
    }
  } catch (err) {
    return;
  }
}

function includes(obj, key) {
  try {
    return isArray(obj) && obj.indexOf(key) !== -1;
  } catch (err) {
    return false;
  }
}

function without() {
  var output = [];
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 0) return output;else if (args.length === 1) return args[0];
  var search = args.slice(1);
  forEach(args[0], function (val) {
    if (!includes(search, val)) output.push(val);
  });
  return output;
}

function omit(obj, values) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (!includes(values, k)) newObj[k] = v;
  });
  return newObj;
}

function contains(list, obj) {
  var found = false;
  forEach(list, function (item) {
    if (item === obj) {
      found = true;
      return false;
    }
  });
  return found;
}

function uniq$1(list) {
  var newList = [];
  forEach(list, function (item) {
    if (!contains(newList, item)) newList.push(item);
  });
  return newList;
}

function union$1() {
  var args = Array.prototype.slice.call(arguments);
  var newList = [];
  forEach(args, function (list) {
    newList = newList.concat(list);
  });
  return uniq$1(newList);
}

function toArray$1(args) {
  return Array.prototype.slice.call(args);
}

var _ = {
  isFunction: isFunction,
  isNumber: isNumber,
  isString: isString,
  isArray: isArray,
  ensureArray: ensureArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isObject: isObject,
  isHash: isHash,
  toString: toString,
  keys: keys$1,
  forEach: forEach,
  includes: includes,
  without: without,
  omit: omit,
  contains: contains,
  uniq: uniq$1,
  union: union$1,
  toArray: toArray$1
};

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
    options = options && (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' ? options : {};

    // user specified values
    this._r = r;
    this._options = options;
    this._connection = connection;

    // interpreted options
    this._db = stringDefault(options.db, 'test');
    this._prefix = stringDefault(options.prefix, 'acl_');
    this._table = stringDefault(options.table, 'access');
    this._single = options.useSingle === true;
    this._ensureTable = options.ensureTable === true;
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
    value: function del(trx, bucket, keys$$1) {
      var _this2 = this;

      contract(arguments).params('array', 'string', 'string|array').end();
      keys$$1 = encodeAll(keys$$1);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);

      // add the table
      if (trx.tables.indexOf(tableName) === -1) trx.tables.push(tableName);

      // build the operation
      var op = r.db(db).table(tableName).filter(function (doc) {
        return _this2._single ? r.expr(keys$$1).contains(doc('key')).and(doc('_bucketname').eq(bucket)) : r.expr(keys$$1).contains(doc('key'));
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

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);
      var filter = this._keyFilter(key, bucket);

      return this._enforceTables(tableName).do(function () {
        return r.db(db).table(tableName).filter(filter).without(OMIT_FIELDS).nth(0).default(null);
      }).run(this._connection).then(function (doc) {
        return doc ? cb(undefined, keys(fixKeys(doc))) : cb(undefined, []);
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
    }

    /**
     *
     * @param bucket
     * @param keys
     * @param cb
     */

  }, {
    key: 'union',
    value: function union$$1(bucket, keys$$1, cb) {
      var _this4 = this;

      contract(arguments).params('string', 'array', 'function').end();
      keys$$1 = encodeAll(keys$$1);

      var r = this._r;
      var db = this._db;
      var tableName = this._getTableName(bucket);

      return this._enforceTables(tableName).do(function () {
        return r.db(db).table(tableName).filter(function (doc) {
          return _this4._single ? r.expr(keys$$1).contains(doc('key')).and(doc('_bucketname').eq(bucket)) : r.expr(keys$$1).contains(doc('key'));
        }).without(OMIT_FIELDS).coerceTo('array');
      }).run(this._connection).then(function (docs) {
        var res = docs.reduce(function (accum, doc) {
          keys(fixKeys(doc)).forEach(function (key) {
            return accum.push(key);
          });
          return accum;
        }, []);

        return cb(undefined, union(res));
      }, cb);
    }

    /**
     * When set to ensure tables, creates tables that do not exist
     * @param tables
     * @private
     */

  }, {
    key: '_enforceTables',
    value: function _enforceTables(tables) {
      var _this5 = this;

      var r = this._r;
      var db = this._db;
      tables = Array.isArray(tables) ? tables : [tables];

      return r.expr(tables).forEach(function (tableName) {
        return r.db(db).tableList().contains(tableName).branch([], r.expr(_this5._ensureTable).eq(true).branch(r.db(db).tableCreate(tableName).do(function () {
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
