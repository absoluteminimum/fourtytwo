export default function makeGlobal(ext): mixed {
  if (typeof window !== "undefined" && typeof window !== undefined && window && !window.ext)
    window.ext = ext
  if (global && typeof global === 'object')
    global.ext = ext
  return ext
}
