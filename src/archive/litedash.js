/*

  Lite version of several lodash functions.
  May not all work exactly the same as lodash in all situations

  Author: Branden Horiuchi <bhoriuchi@gmail.com>

*/

export function isFunction (obj) {
  return typeof obj === 'function'
}

export function isString (obj) {
  return typeof obj === 'string'
}

export function isNumber (obj) {
  return typeof obj === 'number'
}

export function isArray (obj) {
  return Array.isArray(obj)
}

export function ensureArray (obj) {
  return !obj ? [] : isArray(obj) ? obj : [obj]
}

export function isBoolean (obj) {
  return typeof obj === 'boolean'
}

export function isDate (obj) {
  return obj instanceof Date
}

export function isObject (obj) {
  return typeof obj === 'object' && obj !== null
}

export function isHash (obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null
}
export function toString (obj) {
  try {
    if (isHash(obj) || isArray(obj)) return JSON.stringify(obj)
    else if (has(obj, 'toString')) return obj.toString()
    else return String(obj)
  } catch (err) {}
  return ''
}

export function keys (obj) {
  try { return Object.keys(obj) }
  catch (err) { return [] }
}

export function forEach (obj, fn) {
  try {
    if (isArray(obj)) {
      let idx = 0
      for (let val of obj) {
        if (fn(val, idx) === false) break
        idx++
      }
    } else {
      for (const key in obj) {
        if (fn(obj[key], key) === false) break
      }
    }
  } catch (err) {
    return
  }
}

export function includes (obj, key) {
  try {
    return isArray(obj) && obj.indexOf(key) !== -1
  } catch (err) {
    return false
  }
}

export function without () {
  let output = []
  let args = Array.prototype.slice.call(arguments)
  if (args.length === 0) return output
  else if (args.length === 1) return args[0]
  let search = args.slice(1)
  forEach(args[0], (val) => {
    if (!includes(search, val)) output.push(val)
  })
  return output
}

export function omit (obj, values) {
  let newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, (v, k) => {
    if (!includes(values, k)) newObj[k] = v
  })
  return newObj
}

export function contains (list, obj) {
  let found = false
  forEach(list, (item) => {
    if (item === obj) {
      found = true
      return false
    }
  })
  return found
}

export function uniq (list) {
  let newList = []
  forEach(list, (item) => {
    if (!contains(newList, item)) newList.push(item)
  })
  return newList
}

export function union () {
  let args = Array.prototype.slice.call(arguments)
  let newList = []
  forEach(args, (list) => {
    newList = newList.concat(list)
  })
  return uniq(newList)
}

export function toArray (args) {
  return Array.prototype.slice.call(args)
}

export default {
  isFunction,
  isNumber,
  isString,
  isArray,
  ensureArray,
  isBoolean,
  isDate,
  isObject,
  isHash,
  toString,
  keys,
  forEach,
  includes,
  without,
  omit,
  contains,
  uniq,
  union,
  toArray
}