'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

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

function keys(obj) {
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

function uniq(list) {
  var newList = [];
  forEach(list, function (item) {
    if (!contains(newList, item)) newList.push(item);
  });
  return newList;
}

function union() {
  var args = Array.prototype.slice.call(arguments);
  var newList = [];
  forEach(args, function (list) {
    newList = newList.concat(list);
  });
  return uniq(newList);
}

function toArray(args) {
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
  keys: keys,
  forEach: forEach,
  includes: includes,
  without: without,
  omit: omit,
  contains: contains,
  uniq: uniq,
  union: union,
  toArray: toArray
};

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
  var i, len;
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

function getTableName(backend, bucket) {
  return backend.prefix + (backend.useSingle ? backend.table : bucket);
}

function getTable(backend, bucket) {
  var name = getTableName(backend, bucket);
  var table = backend._dbc.table(name);
  return { name: name, table: table };
}

function pushUniq(val) {
  var arr = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  if (!_.includes(arr, val)) arr.push(val);
  return arr;
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

function encodeAll(arr) {
  if (Array.isArray(arr)) {
    var ret = [];
    arr.forEach(function (aval) {
      ret.push(encodeText(aval));
    });
    return ret;
  } else {
    return arr;
  }
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
  } else {
    return doc;
  }
}

function fixAllKeys(docs) {
  if (docs && docs.length) {
    var ret = [];
    docs.forEach(function (adoc) {
      ret.push(fixKeys(adoc));
    });
    return ret;
  } else {
    return docs;
  }
}

function makeArray(arr) {
  return Array.isArray(arr) ? encodeAll(arr) : [encodeText(arr)];
}
/* end https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js */

function selectKeys(backend, keys, bucket) {
  return function (doc) {
    var query = backend.r.expr(keys).contains(doc('key'));
    return backend.useSingle ? query.and(doc('_bucketname').eq(bucket)) : query;
  };
}

function selectKey(backend, key, bucket) {
  var filter = { key: key };
  if (backend.useSingle) filter._bucketname = bucket;
  return filter;
}

function ensureTable(backend) {
  var tables = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  var exec = arguments[2];
  var cb = arguments[3];

  tables = Array.isArray(tables) ? tables : [tables];

  return backend.r.do(backend._dbc.tableList(), function (list) {
    return backend.r.expr(tables).forEach(function (name) {
      return backend.r.branch(list.contains(name).not(), backend._dbc.tableCreate(name), []);
    });
  }).run(backend.connection).then(exec).catch(function (err) {
    cb(err);
  });
}

var OMIT_FIELDS = { _bucketname: true, key: true, id: true };

function RethinkDBBackend(r, opts, connection) {
  opts = _.isHash(opts) ? opts : {};
  this.r = r;
  this.db = opts.db || 'test';
  this.prefix = opts.prefix || '';
  this.useSingle = Boolean(opts.useSingle);
  this.table = opts.table || 'resources';
  this.ensureTable = Boolean(opts.ensureTable);
  this.connection = connection;
  this._dbc = this.r.db(this.db);
}

RethinkDBBackend.prototype = {

  /**
   Begins a transaction
   */
  begin: function begin() {
    return { tables: [], ops: [] };
  },

  /**
   Ends a transaction (and executes it)
   */
  end: function end(trx, cb) {
    var _this = this;

    contract(arguments).params('array', 'function').end();

    var exec = function exec() {
      return _this.r.do(trx.ops, function (res) {
        return res;
      }).run(_this.connection).then(function () {
        cb();
      }).catch(function (err) {
        cb(err);
      });
    };

    this.ensureTable ? ensureTable(this, trx.tables, exec, cb) : exec();
  },

  /**
   Cleans the whole storage.
   */
  clean: function clean(cb) {
    var _this2 = this;

    contract(arguments).params('function').end();

    return this._dbc.tableList().filter(function (name) {
      var coll = _this2.useSingle ? _this2.prefix + _this2.table : _this2.prefix;
      var rx = coll ? '(?i)^' + coll : '.*';
      return name.match(rx);
    }).forEach(function (name) {
      return _this2._dbc.tableDrop(name);
    }).run(this.connection).then(function () {
      cb();
    }).catch(function (err) {
      cb(err);
    });
  },

  /**
   Gets the contents at the bucket's key.
   */
  get: function get(bucket, key, cb) {
    var _this3 = this;

    contract(arguments).params('string', 'string|number', 'function').end();

    var t = getTable(this, bucket);
    var filter = selectKey(this, key, bucket);

    var exec = function exec() {
      var query = t.table.filter(filter).without(OMIT_FIELDS).coerceTo('array');
      return query.run(_this3.connection).then(function (docs) {
        if (docs.length) return cb(null, _.keys(docs[0]));
        cb(null, []);
      }).catch(function (err) {
        cb(err);
      });
    };

    this.ensureTable ? ensureTable(this, t.name, exec, cb) : exec();
  },

  /**
   * UN-TESTED
   Gets an object mapping each passed bucket to the union of the specified keys inside that bucket.
   */
  unions: function unions(buckets, keys, cb) {
    var _this4 = this;

    contract(arguments).params('array', 'array', 'function').end();

    var result = {};

    return this.r.expr(buckets).map(function (bucket) {
      var t = getTable(_this4, bucket);
      var filter = selectKeys(_this4, keys, bucket);
      return t.table.filter(filter).without(OMIT_FIELDS);
    }).coerceTo('array').run(this.connection).then(function (results) {
      _.forEach(buckets, function (name, idx) {
        var docs = results[idx];
        if (!docs.length) {
          result[name] = [];
        } else {
          (function () {
            var keyArrays = [];
            fixAllKeys(docs).forEach(function (doc) {
              keyArrays.push.apply(keyArrays, _.keys(doc));
            });
            result[name] = _.union(keyArrays);
          })();
        }
      });
      cb(null, result);
    }).catch(function (err) {
      cb(err);
    });
  },

  /**
   Returns the union of the values in the given keys.
   */
  union: function union(bucket, keys, cb) {
    contract(arguments).params('string', 'array', 'function').end();

    keys = makeArray(keys);

    var keyArrays = [];
    var t = getTable(this, bucket);
    var filter = selectKeys(this, keys, bucket);
    var query = t.table.filter(filter).without(OMIT_FIELDS).coerceTo('array');

    return query.run(this.connection).then(function (docs) {
      if (!docs.length) return cb(null, []);
      fixAllKeys(docs).forEach(function (doc) {
        keyArrays.push.apply(keyArrays, _.keys(doc));
      });
      cb(null, _.union(keyArrays));
    }).catch(function (err) {
      cb(err);
    });
  },

  /**
   Adds values to a given key inside a bucket.
   */
  add: function add(trx, bucket, key, values) {
    var _this5 = this;

    contract(arguments).params('array', 'string', 'string|number', 'string|array|number').end();

    if (key === 'key') throw new Error("Key name 'key' is not allowed.");
    key = encodeText(key);

    var doc = {};
    var t = getTable(this, bucket);
    var filter = selectKey(this, key, bucket);

    values = makeArray(values);
    values.forEach(function (value) {
      doc[value] = true;
    });
    pushUniq(t.name, trx.tables);

    trx.ops.push(this.r.do(t.table.filter(filter).coerceTo('array'), function (docs) {
      return _this5.r.branch(docs.count().gt(0).coerceTo('bool'), t.table.get(docs.nth(0)('id')).update(doc), t.table.insert(Object.assign({}, filter, doc)));
    }));
  },

  /**
   Delete the given key(s) at the bucket
   */
  del: function del(trx, bucket, keys) {
    var _this6 = this;

    contract(arguments).params('array', 'string', 'string|array').end();

    keys = makeArray(keys);

    var t = getTable(this, bucket);
    var filter = selectKeys(this, keys, bucket);

    pushUniq(t.name, trx.tables);

    trx.ops.push(this.r.do(t.table.filter(filter).coerceTo('array'), function (docs) {
      return _this6.r.branch(docs.count().gt(0).coerceTo('bool'), t.table.filter(filter).delete(), []);
    }));
  },

  /**
   Removes values from a given key inside a bucket.
   */
  remove: function remove(trx, bucket, key, values) {
    var _this7 = this;

    contract(arguments).params('array', 'string', 'string|number', 'string|array|number').end();

    key = encodeText(key);

    var doc = {};
    var t = getTable(this, bucket);
    var filter = selectKey(this, key, bucket);

    values = makeArray(values);
    values.forEach(function (value) {
      doc[value] = true;
    });
    pushUniq(t.name, trx.tables);

    trx.ops.push(this.r.do(t.table.filter(filter).without(doc).coerceTo('array'), function (docs) {
      return _this7.r.branch(docs.count().gt(0).coerceTo('bool'), t.table.get(docs.nth(0)('id')).replace(docs.nth(0)), []);
    }));
  }
};

module.exports = RethinkDBBackend;