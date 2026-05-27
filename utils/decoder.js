// JSON:API response decoder — unchanged from the Nuxt 2 starter.

export function extractData(that) {
  if (that.data) return extractData(that.data)
  return that
}

export function extractIncludes(that) {
  if (that.included) return that.included
  if (that.data && that.data.included) return that.data.included
  return false
}

export function extractDATA(response) {
  if (response.data) return extractDATA(response.data)
  return response
}

export function extractJWT(headers) {
  return {
    client: headers['client'],
    uid: headers['uid'],
    expiry: headers['expiry'],
    'access-token': headers['access-token'],
    'token-type': headers['token-type'],
    token: headers['access-token'],
  }
}

export function assignObj(that) {
  return Object.assign({ id: that.id, type: that.type }, that.attributes)
}

export function assignObjNested(that, includes = false) {
  if (!includes) includes = that.included

  if (that) {
    if (that.data && that.data.attributes) that = that.data

    if (that && that.relationships && includes) {
      const rel = {}
      const keys = Object.keys(that.relationships)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const val = that.relationships[key].data
        if (Array.isArray(val)) {
          rel[key] = []
          for (let ii = 0; ii < val.length; ii++) {
            rel[key].push(assignObjNested(findIncluded(includes, val[ii]), includes))
          }
        } else {
          rel[key] = assignObjNested(findIncluded(includes, val), includes)
        }
      }
      if (rel['translations'] && rel['translations'].length) {
        for (let ii = 0; ii < rel['translations'].length; ii++) {
          const lcl = rel['translations'][ii]
          if (!rel['locales']) rel['locales'] = {}
          if (lcl && lcl.locale) rel['locales'][lcl.locale] = lcl
        }
      }
      return Object.assign({ id: that.id, type: that.type }, that.attributes, rel)
    }
    return Object.assign({ id: that.id, type: that.type }, that.attributes)
  }
}

export function assignObjNestedNames(that, includes = false) {
  if (!includes) includes = that.included
  if (!that) return

  if (that.data && that.data.attributes) that = that.data

  if (that && that.relationships && includes) {
    const rel = {}
    const keys = Object.keys(that.relationships)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const val = that.relationships[key].data
      if (Array.isArray(val)) {
        rel[`${key}IDs`] = []
        for (let ii = 0; ii < val.length; ii++) {
          rel[`${key}IDs`].push(findIncluded(includes, val[ii]).id)
        }
      } else {
        const xxx = findIncluded(includes, val)
        if (xxx) rel[`${key}Name`] = xxx.attributes.name
      }
    }
    return Object.assign({ id: that.id, type: that.type }, that.attributes, rel)
  }
  return Object.assign({ id: that.id, type: that.type }, that.attributes)
}

export function assignCollection(data) {
  const collection = []
  if (data && data.length) {
    for (let i = 0; i < data.length; i++) {
      collection.push(assignObj(data[i]))
    }
  }
  return collection
}

export function assignCollectionNested(data, includes = false) {
  const collection = []
  if (data && data.length) {
    for (let i = 0; i < data.length; i++) {
      collection.push(assignObjNested(data[i], includes))
    }
  }
  return collection
}

export function assignCollectionNestedNames(data, includes = false) {
  const collection = []
  if (data && data.length) {
    for (let i = 0; i < data.length; i++) {
      collection.push(assignObjNestedNames(data[i], includes))
    }
  }
  return collection
}

export function assignResponse(that) {
  const data = extractData(that)
  if (typeof data.length === 'number') return assignCollection(data)
  return assignObj(data)
}

export function assignResponseNested(that) {
  const data = extractData(that)
  const includes = extractIncludes(that)
  if (typeof data.length === 'number') return assignCollectionNested(data, includes)
  return assignObjNested(data, includes)
}

export function assignResponseNestedNames(that) {
  const data = extractData(that)
  const includes = extractIncludes(that)
  if (typeof data.length === 'number') return assignCollectionNestedNames(data, includes)
  return assignObjNestedNames(data, includes)
}

export function shuffleCollection(collection) {
  const array = collection
  let counter = array.length
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter)
    counter--
    const temp = array[counter]
    array[counter] = array[index]
    array[index] = temp
  }
  return array
}

export function findIncluded(collection, model) {
  if (!collection || !model) return null
  for (let i = 0; i < collection.length; i++) {
    if (
      String(collection[i].id) === String(model.id) &&
      String(collection[i].type) === String(model.type)
    ) {
      return collection[i]
    }
  }
  return null
}

export function includeFormTranslations(collection) {
  if (!collection) return []
  if (collection.length) {
    for (let i = 0; i < collection.length; i++) {
      collection[i] = includeFormTranslations(collection[i])
    }
  } else {
    const locales = ['de', 'en', 'fr', 'it']
    if (collection.translations && collection.translations.length) {
      for (let ii = 0; ii < collection.translations.length; ii++) {
        const lcl = collection.translations[ii]
        if (!collection.locales) collection.locales = {}
        if (!collection.translationsAttributes) collection.translationsAttributes = []
        collection.locales[lcl.locale] = lcl
        collection.translationsAttributes.push(lcl)
        locales.splice(locales.indexOf(lcl.locale), 1)
      }
      collection.translations = null
    }
  }
  return collection
}
