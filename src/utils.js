import _ from 'lodash'

export function getTableName (backend, bucket) {
  return backend.prefix + (backend.useSingle ? backend.table : bucket)
}

export function getTable (backend, bucket) {
  let name = getTableName(backend, bucket)
  let table = backend.db.table(name)
  return { name, table }
}

export function pushUniq (val, arr = []) {
  if (!_.includes(arr, val)) arr.push(val)
  return arr
}

/* start https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js */
export function encodeText(text) {
  if (typeof text == 'string' || text instanceof String) {
    text = encodeURIComponent(text);
    text = text.replace(/\./g, '%2E');
  }
  return text;
}

export function decodeText(text) {
  if (typeof text == 'string' || text instanceof String) {
    text = decodeURIComponent(text);
  }
  return text;
}

export function encodeAll(arr) {
  if (Array.isArray(arr)) {
    var ret = [];
    arr.forEach(function(aval) {
      ret.push(encodeText(aval));
    });
    return ret;
  } else {
    return arr;
  }
}

export function decodeAll(arr) {
  if (Array.isArray(arr)) {
    var ret = [];
    arr.forEach(function(aval) {
      ret.push(decodeText(aval));
    });
    return ret;
  } else {
    return arr;
  }
}

export function fixKeys(doc) {
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

export function fixAllKeys(docs) {
  if (docs && docs.length) {
    var ret = [];
    docs.forEach(function(adoc) {
      ret.push(fixKeys(adoc));
    });
    return ret;
  } else {
    return docs;
  }
}

export function makeArray(arr){
  return Array.isArray(arr) ? encodeAll(arr) : [encodeText(arr)];
}
/* end https://github.com/OptimalBits/node_acl/blob/master/lib/mongodb-backend.js */


export function selectKeys (backend, keys, bucket) {
  return (doc) => {
    let query = backend.r.expr(keys).contains(doc('key'))
    return backend.useSingle ? query.and(doc('_bucketname').eq(bucket)) : query
  }
}

export function selectKey (backend, key, bucket) {
  let filter = { key }
  if (backend.useSingle) filter._bucketname = bucket
  return filter
}

export default {
  encodeText,
  decodeText,
  encodeAll,
  decodeAll,
  fixKeys,
  fixAllKeys,
  makeArray,
  selectKeys,
  selectKey,
  getTableName,
  getTable
}
