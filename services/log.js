// Lightweight logger to replace vuejs-logger (which is Vue-2 only).
// Use `useLog()` in components, or import { log } in plain JS modules.

// Robust dev-detection. `import.meta.dev` is injected by Nuxt/Vite in BOTH client
// and server bundles — reliable where `process.env.NODE_ENV` is stripped/unset in the
// client bundle (that gap let debug/info lines leak to the browser console in prod).
// Default to PRODUCTION (quiet) unless we can POSITIVELY confirm dev — never leak by accident.
const isDev = (typeof import.meta !== 'undefined' && import.meta.dev === true)
  || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')
const isProd = !isDev

const LEVELS = ['debug', 'info', 'warn', 'error']
const ACTIVE = isProd ? 'error' : 'debug'

function shouldLog(level) {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(ACTIVE)
}

function emit(level, args) {
  if (!shouldLog(level)) return
  const tag = `[${level.toUpperCase()}]`
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](tag, ...args)
}

export const log = {
  debug: (...a) => emit('debug', a),
  info:  (...a) => emit('info',  a),
  warn:  (...a) => emit('warn',  a),
  error: (...a) => emit('error', a),
}

export default log
