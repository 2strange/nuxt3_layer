export function findModel(collection, model, field = 'id') {
  if (!collection) return {}
  for (let i = 0; i < collection.length; i++) {
    if (String(collection[i][field]) === String(model[field])) return collection[i]
  }
  return {}
}

export function updateOrAddModel(collection, model, field = 'id') {
  if (!collection) return [model]
  for (let i = 0; i < collection.length; i++) {
    if (String(collection[i][field]) === String(model[field])) {
      collection[i] = model
      return collection
    }
  }
  collection.push(model)
  return collection
}

export function removeModel(collection, model, field = 'id') {
  if (!collection) return []
  for (let i = 0; i < collection.length; i++) {
    if (collection[i][field] && String(collection[i][field]) === String(model[field])) {
      collection.splice(i, 1)
      return collection
    }
  }
  return collection
}

export function removeModelOrChildren(collection, model, childName = 'children') {
  if (!collection) return []
  for (let i = 0; i < collection.length; i++) {
    const that = collection[i]
    if (String(that.id) === String(model.id)) {
      collection.splice(i, 1)
      return collection
    }
    if (that[childName] && that[childName].length) {
      removeModelOrChildren(that[childName], model, childName)
    }
  }
  return collection
}

export function existsModelOrChildren(collection, model, childName = 'children') {
  if (!collection) return false
  for (let i = 0; i < collection.length; i++) {
    const that = collection[i]
    if (String(that.id) === String(model.id)) return that
    if (that[childName] && that[childName].length) {
      const chilcCheck = existsModelOrChildren(that[childName], model, childName)
      if (chilcCheck) return chilcCheck
    }
  }
  return false
}

export function findModelOrChildren(collection, model, childName = 'children') {
  return existsModelOrChildren(collection, model, childName) || {}
}

export function findById(collection, id) {
  if (!collection) return {}
  for (let i = 0; i < collection.length; i++) {
    if (String(collection[i].id) === String(id)) return collection[i]
  }
  return {}
}

export function findByAttr(collection, attribut, value) {
  if (!collection) return {}
  for (let i = 0; i < collection.length; i++) {
    if (collection[i][attribut] && String(collection[i][attribut]) === String(value)) return collection[i]
  }
  return {}
}

export function findWhereAttr(collection, attribut, value) {
  const result = []
  if (!collection) return result
  for (let i = 0; i < collection.length; i++) {
    if (collection[i][attribut] && String(collection[i][attribut]) === String(value)) {
      result.push(collection[i])
    }
  }
  return result
}

export function findWhereAttrArray(collection, valueArray, attribut = 'id') {
  const result = []
  if (!collection || !valueArray) return result
  if (typeof valueArray === 'string') return findWhereAttr(collection, attribut, valueArray)

  const checkArray = []
  for (let index = 0; index < valueArray.length; index++) {
    checkArray.push(String(valueArray[index]))
  }
  for (let i = 0; i < collection.length; i++) {
    if (collection[i][attribut] && checkArray.indexOf(String(collection[i][attribut])) > -1) {
      result.push(collection[i])
    }
  }
  return result
}

export function findIndex(collection, model, field = 'id') {
  if (!collection) return null
  for (let i = 0; i < collection.length; i++) {
    if (String(collection[i][field]) === String(model[field])) return i
  }
  return null
}

export function findIndexById(collection, id) {
  if (!collection) return null
  for (let i = 0; i < collection.length; i++) {
    if (String(collection[i].id) === String(id)) return i
  }
  return null
}

export function removeIDfromList(list, id) {
  if (!list) return []
  let pos = null
  if (list.indexOf(parseInt(id)) > -1) pos = list.indexOf(parseInt(id))
  else if (list.indexOf(String(id)) > -1) pos = list.indexOf(String(id))
  if (pos !== null) return list.splice(pos, 1)
  return list
}
