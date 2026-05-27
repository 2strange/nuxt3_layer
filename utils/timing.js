// Layout-grid helper kept from the old codebase.
export function gridSize(length) {
  let that = 12
  if (!length || isNaN(length) || length === 0) return that
  if (length <= 4) that = 12 / length
  if (length > 4 && length <= 8) that = 12 / Math.ceil(length / 2)
  if (length > 8 && length <= 12) that = 12 / Math.ceil(length / 3)
  if (length > 12 && length <= 16) that = 12 / Math.ceil(length / 4)
  if (length > 16) that = 12 / Math.ceil(length / 5)
  return that
}
