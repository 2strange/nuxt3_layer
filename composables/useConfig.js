import appStylez from '~/utils/style.config'

// Replaces the legacy CONFIG() / STYLE() mixin helpers.
//
// In layer-land we no longer import from a project-specific `~/app-conf` file.
// Instead `CONFIG(key)` reads from Nuxt's built-in `useAppConfig()` (which
// auto-merges `app.config.ts` across the layer and the consuming project) and
// falls back to `useRuntimeConfig().public` for env-driven values.
//
// Layer's `app.config.ts` defines the *shape* with sensible defaults;
// each project overrides keys by adding its own `app.config.ts`.
export function useConfig() {
  const appConfig = useAppConfig()
  const runtime = useRuntimeConfig()

  function lookup(source, key) {
    if (!source) return undefined
    const parts = `${key}`.split('.')
    let cur = source
    for (let i = 0; i < parts.length; i++) {
      if (cur == null) return undefined
      cur = cur[parts[i]]
    }
    return cur
  }

  function CONFIG(key) {
    if (!key) return { ...appConfig, ...runtime.public }
    const fromApp = lookup(appConfig, key)
    if (fromApp !== undefined) return fromApp
    return lookup(runtime.public, key)
  }

  function STYLE(key) {
    return appStylez[key]
  }

  return { CONFIG, STYLE, appConfig, runtime, appStylez }
}
