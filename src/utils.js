
export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function round(number, decimals = 0) {
    const pow = Math.pow(10, decimals)
    return Math.round(number * pow) / pow
}

export const lerp = (x, y, a) => x * (1 - a) + y * a

const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a))

export const invlerp = (x, y, a) => clamp((a - x) / (y - x))

export function arraysEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true
}
