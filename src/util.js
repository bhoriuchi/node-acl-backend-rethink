import _ from 'lodash'

export function decodeAll (arrOrText) {
  return _.map(_.castArray(arrOrText), decodeText)
}

export function decodeText (text) {
  return _.isString(text)
    ? decodeURIComponent(text)
    : text
}

export function encodeAll (arrOrText) {
  return _.map(_.castArray(arrOrText), encodeText)
}

export function encodeText (text) {
  return _.isString(text)
    ? encodeURIComponent(text).replace(/\./g, '%2E')
    : text
}

export function getTypeName (val) {
  return _.isObject(val) && val
    ? val.constructor.name
    : null
}

export function stringDefault (val, defaultValue) {
  return _.isString(val) && val
    ? val
    : defaultValue
}
