// Path helpers for building API URLs.
// In Nuxt 3 we use $fetch which respects a baseURL configured in useApi(),
// so these functions just produce the *relative* path.

export function appPath(locale, prefix, path, objektOrId = null) {
  let newPath = `${locale ? '/' + locale : ''}${prefix}`
  if (String(path)[0] === '/') {
    newPath += `${path}`
  } else {
    newPath += `/${path}`
  }
  if (objektOrId) {
    const paramType = typeof objektOrId
    if (['string', 'number'].includes(paramType)) {
      newPath += `/${objektOrId}`
    } else {
      newPath += `/${objektOrId.id}`
    }
  }
  return newPath
}

export function apiPath(locale, path, objektOrId = null) {
  return appPath(locale, '', path, objektOrId)
}

export function backendPath(locale, path, objektOrId = null) {
  return appPath(locale, '/backend', path, objektOrId)
}

export function adminPath(locale, path, objektOrId = null) {
  return appPath(locale, '/admin', path, objektOrId)
}

export function sendOptions(fileForm) {
  if (fileForm) {
    return { headers: { 'content-type': 'multipart/form-data' } }
  }
  return {}
}

export function asignSendObject(sendObj, rootKey, key, val) {
  if (val !== null && val !== undefined) {
    if (typeof val === 'object' && String(val) !== '[object File]' && !Array.isArray(val)) {
      const childKeys = Object.keys(val)
      for (let ii = 0; ii < childKeys.length; ii++) {
        const childKey = childKeys[ii]
        sendObj = asignSendObject(sendObj, `${rootKey}[${key}]`, childKey, val[childKey])
      }
    } else if (Array.isArray(val)) {
      for (let ii = 0; ii < val.length; ii++) {
        sendObj = asignSendObject(sendObj, `${rootKey}[${key}]`, '', val[ii])
      }
    } else {
      sendObj.append(`${rootKey}[${key}]`, val)
    }
  }
  return sendObj
}

export function sendObjekt(data) {
  let sendObj = data.obj
  if (data.fileForm) {
    sendObj = new FormData()
    const keys = Object.keys(data.obj.objekt)
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      const that = data.obj.objekt[key]
      if (data.nestedRelations && data.nestedRelations.indexOf(key) !== -1) {
        key = `${key}Attributes`
      }
      sendObj = asignSendObject(sendObj, 'objekt', key, that)
    }
  }
  return sendObj
}
