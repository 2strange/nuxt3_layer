// Resolver hook: maps the layer's `~/...` aliases (Nuxt/Vite-only) to real files
// so plain `node --test` can import layer modules without a bundler.
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const LAYER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export function resolve(specifier, context, next) {
  if (specifier.startsWith('~/')) {
    let target = path.join(LAYER_ROOT, specifier.slice(2))
    if (!fs.existsSync(target)) {
      for (const ext of ['.js', '.mjs', '.ts']) {
        if (fs.existsSync(target + ext)) { target += ext; break }
      }
    }
    return next(pathToFileURL(target).href, context)
  }
  return next(specifier, context)
}
