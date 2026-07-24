import assert from 'node:assert/strict'
import test from 'node:test'

import { isSameRoutePath } from '../utils/api.js'

test('route comparison ignores trailing slashes without matching other routes', () => {
  assert.equal(isSameRoutePath('/crew/login', '/crew/login'), true)
  assert.equal(isSameRoutePath('/crew/login/', '/crew/login'), true)
  assert.equal(isSameRoutePath('/crew/login///', '/crew/login/'), true)
  assert.equal(isSameRoutePath('/403/', '/403'), true)
  assert.equal(isSameRoutePath('/crew/login/reset', '/crew/login'), false)
  assert.equal(isSameRoutePath('/crew', '/crew/login'), false)
})
