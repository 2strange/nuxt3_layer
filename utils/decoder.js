// JSON:API response decoder — ported from the Nuxt 2 starter, hardened in
// v0.1.3 (null-guards, O(1) included-lookup, cycle guard). The public API and
// the output for valid inputs are unchanged.

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

export function assignObjNested(that, includes = false, _seen = null) {
  // Unresolvable refs (missing/sparse include) consistently yield null —
  // never undefined (previously to-one refs became undefined and to-many
  // arrays silently collected undefined entries).
  if (!that) return null

  if (!includes) includes = that.included
  if (that.data && that.data.attributes) that = that.data

  if (that && that.relationships && includes) {
    // Cycle guard: track "type:id" per traversal path. A ref that points back
    // into its own path is NOT resolved again — it is treated exactly like a
    // missing include (null / skipped) instead of recursing forever.
    const seen = _seen ? new Set(_seen) : new Set()
    seen.add(`${that.type}:${that.id}`)

    const rel = {}
    const keys = Object.keys(that.relationships)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const val = that.relationships[key].data
      if (Array.isArray(val)) {
        rel[key] = []
        for (let ii = 0; ii < val.length; ii++) {
          const ref = val[ii]
          const record = ref && !seen.has(`${ref.type}:${ref.id}`) ? lookupIncluded(includes, ref) : null
          const resolved = assignObjNested(record, includes, seen)
          if (resolved != null) rel[key].push(resolved)
        }
      } else {
        const record = val && !seen.has(`${val.type}:${val.id}`) ? lookupIncluded(includes, val) : null
        rel[key] = assignObjNested(record, includes, seen)
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
          // sparse includes: skip unresolvable refs instead of throwing
          const xxx = lookupIncluded(includes, val[ii])
          if (xxx) rel[`${key}IDs`].push(xxx.id)
        }
      } else {
        const xxx = lookupIncluded(includes, val)
        if (xxx && xxx.attributes) rel[`${key}Name`] = xxx.attributes.name
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
  if (Array.isArray(data)) return assignCollection(data)
  return assignObj(data)
}

export function assignResponseNested(that) {
  const data = extractData(that)
  const includes = extractIncludes(that)
  if (Array.isArray(data)) return assignCollectionNested(data, includes)
  return assignObjNested(data, includes)
}

export function assignResponseNestedNames(that) {
  const data = extractData(that)
  const includes = extractIncludes(that)
  if (Array.isArray(data)) return assignCollectionNestedNames(data, includes)
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

// Internal O(1) replacement for findIncluded in the nested traversal: builds a
// "type:id" → record Map once per `included` array (O(n) ingest, cached via
// WeakMap on the array reference), instead of a linear scan per relationship
// (O(n²) on nested includes). Same result semantics as findIncluded — first
// match wins, not-found → null. Note: assumes the `included` array is not
// mutated between lookups (true for normal response decoding).
const includedIndexCache = new WeakMap()

function lookupIncluded(includes, model) {
  if (!includes || !model) return null
  if (!Array.isArray(includes)) return findIncluded(includes, model)
  let index = includedIndexCache.get(includes)
  if (!index) {
    index = new Map()
    for (let i = 0; i < includes.length; i++) {
      const record = includes[i]
      if (!record) continue
      const key = `${record.type}:${record.id}`
      if (!index.has(key)) index.set(key, record)
    }
    includedIndexCache.set(includes, index)
  }
  return index.get(`${model.type}:${model.id}`) || null
}

export function includeFormTranslations(collection) {
  if (!collection) return []
  if (Array.isArray(collection)) {
    for (let i = 0; i < collection.length; i++) {
      collection[i] = includeFormTranslations(collection[i])
    }
  } else {
    const locales = ['de', 'en', 'fr', 'it']
    if (collection.translations && collection.translations.length) {
      for (let ii = 0; ii < collection.translations.length; ii++) {
        const lcl = collection.translations[ii]
        if (!lcl || !lcl.locale) continue
        if (!collection.locales) collection.locales = {}
        if (!collection.translationsAttributes) collection.translationsAttributes = []
        collection.locales[lcl.locale] = lcl
        collection.translationsAttributes.push(lcl)
        // unknown locale: leave the list untouched (indexOf -1 + splice(-1)
        // used to wrongly remove the LAST entry)
        const idx = locales.indexOf(lcl.locale)
        if (idx !== -1) locales.splice(idx, 1)
      }
      collection.translations = null
    }
  }
  return collection
}
