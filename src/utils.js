import _ from 'lodash'

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

export function hasKey (backend, key, bucket, success, fail) {

  let collName = backend.useSingle ? backend.table : bucket
  let bucketName = backend.prefix + collName

  return backend.r.do(
    backend.db.table(bucketName).filter(selectKey(backend, key, bucket)),
    (docs) => {
      return backend.r.branch(
        docs.count().gt(0),
        backend.r.expr(success(docs)),
        backend.r.expr(fail())
      )
    }
  )
}


// re-usable get union function which returns a query
export function getUnion (backend, bucket, keys, cb) {

  let collName = backend.useSingle ? backend.table : bucket
  let bucketName = backend.prefix + collName
  
  return backend.r.do(
    backend.db.table(bucketName).filter(selectKeys(backend, keys, bucket)),
    (docs) => {
      if (!docs.length) return cb([])
      var keyArrays = []
      docs = fixAllKeys(docs)
      docs.forEach((doc) => {
        keyArrays.push.apply(keyArrays, _.keys(doc))
      })
      return cb(_.without(_.union(keyArrays), 'key', 'id', '_bucketname'))
    }
  )
}

export function pushAdd (backend, trx, bucket, collName, key, values, createTable = false) {
  let table = backend.db.table(backend.prefix + collName)
  let doc = {}

  values.forEach((value) => { doc[value] = true })

  if (createTable) trx.push(backend.db.tableCreate(backend.prefix + collName))
  trx.push(
    hasKey(
      backend,
      key,
      bucket,
      // success
      (docs) => {
        docs.update(doc)
      },
      // fail
      () => {
        table.insert(doc)
      }
    )
  )
  if (backend.useSingle) trx.push(table.index_create('_bucketname', 'key'))
  
  return trx
}

export function tableExists (backend, tableName, success, fail) {
  return backend.r.do(
    backend.db.tableList().filter((name) => {
      return name.eq(tableName)
    }),
    (list) => {
      backend.r.branch(
        list.count().gt(0),
        backend.r.expr(success()),
        backend.r.expr(fail())
      )
    }
  )
}

export default {
  encodeText,
  decodeText,
  encodeAll,
  decodeAll,
  fixKeys,
  fixAllKeys,
  makeArray,
  getUnion,
  pushAdd,
  tableExists,
  selectKeys,
  selectKey,
  hasKey
}
