// Tiny pub/sub replacement for the old Vue 2 `new Vue()` event bus.
// Usage:
//   const bus = useEventBus()
//   bus.on('thing', payload => ...)
//   bus.emit('thing', payload)
//   bus.off('thing', handler)

const listeners = new Map()

export function useEventBus() {
  function on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(fn)
  }
  function off(event, fn) {
    listeners.get(event)?.delete(fn)
  }
  function emit(event, payload) {
    listeners.get(event)?.forEach((fn) => {
      try { fn(payload) } catch (e) { console.error('EventBus handler error', e) }
    })
  }
  return { on, off, emit }
}
