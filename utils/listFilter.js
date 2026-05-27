// Reine Client-Filter-Logik für Index-Listen (Query + State).
// Aus KeyHubs indexItemsMixin#filteredItems herausgezogen -> testbar.
export function filterItems(items, filter = {}, fields = ['name']) {
  return (items || []).filter((item) => {
    let okQuery = true
    if (filter.query) {
      const re = new RegExp(String(filter.query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      okQuery = fields.some((f) => item[f] && String(item[f]).match(re))
    }
    let okState = true
    if (filter.states && filter.states.length) {
      okState = filter.states.includes(item.state) || filter.states.includes(item.fsmState)
    }
    return okQuery && okState
  })
}
