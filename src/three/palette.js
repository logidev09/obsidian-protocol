// Palet 3D — sengaja low-chroma supaya tidak norak di layar besar.
export const PALETTE = {
  bg: '#07090c',
  fog: '#0a0d12',
  surface: '#141a22',
  surfaceLight: '#1d2530',
  edge: '#3a4655',
  accent: '#4fd1c5',
  accentDim: '#2f7d77',
  amber: '#d9a066',
  violet: '#8b7fd4',
  text: '#e7ebf0'
}

export const LOW_END =
  typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4

export const PREFERS_REDUCED =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const DPR = LOW_END ? [1, 1.35] : [1, 1.9]

export const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const lerp = (a, b, t) => a + (b - a) * t
