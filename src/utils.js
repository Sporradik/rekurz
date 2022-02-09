
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
