export function getTypeName (val) {
  return val && typeof val === 'object'
    ? val.constructor.name
    : null
}

export function stringDefault (val, defaultValue) {
  return val && typeof val === 'string'
    ? val
    : defaultValue
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

export function encodeAll(arrOrText) {
  return Array.isArray(arrOrText)
    ? arrOrText.map(item => encodeText(item))
    : [encodeText(arrOrText)]
}

export function fixKeys(doc) {
  if (doc) {
    let ret = {}
    for (var key in doc) {
      if (doc.hasOwnProperty(key)) {
        ret[decodeText(key)] = doc[key]
      }
    }
    return ret
  }
  return doc
}

export function union () {
  let args = [ ...arguments ]
  if (!args.length) return []

  try {
    let u = args.reduce((prev, cur) => {
      if (!Array.isArray(prev) || !Array.isArray(cur)) return []
      return prev.concat(cur)
    }, [])

    return [ ...new Set(u) ]
  } catch (err) {
    return []
  }
}

export function range (n) {
  return new Array(n).fill(null).reduce((accum, val, idx) => {
    accum.push(idx)
    return accum
  }, [])
}

export function keys (obj) {
  try {
    return Array.isArray(obj)
      ? range(obj.length)
      : Object.keys(obj)
  } catch (err) {
    return []
  }
}

export function uniq (list) {
  return Array.isArray(list)
    ? [ ...new Set(list) ]
    : []
}