import { push } from '../../../push'

/**
 * Creates an array of elements split into groups the length of `size`. If `array` can't be split evenly, the final chunk will be the remaining elements.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 2,443 bytes
 * - Micro-dash: 195 bytes
 */
export async function chunk<T>(array: readonly T[], size = 1): Promise<T[][]> {
  size = Math.max(Math.trunc(size), 0)
  const chunks: T[][] = []
  await push(function* () {
    for (let i = 0; i < array.length; i += Math.max(1, size)) {
      chunks.push(array.slice(i, i + size))
      yield
    }
  })
  return chunks
}
