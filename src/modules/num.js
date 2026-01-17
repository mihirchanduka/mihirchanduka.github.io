export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function map(value, inMin, inMax, outMin, outMax) {
  const mapped =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  return clamp(mapped, outMin, outMax);
}

export function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

export function smoothstep(x) {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
}
