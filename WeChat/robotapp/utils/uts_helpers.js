export function toStr(v) {
  if (v == null) return ''
  return '' + v
}

export function nonEmpty(v) {
  return toStr(v).length > 0
}

export function storageString(key) {
  try {
    return toStr(uni.getStorageSync(key))
  } catch (e) {
    return ''
  }
}

export function errMsgFromCatch(e) {
  if (e == null) return ''
  return toStr(e.errMsg)
}

export function parseFloatSafe(v) {
  const n = parseFloat(toStr(v))
  return isNaN(n) ? 0 : n
}
