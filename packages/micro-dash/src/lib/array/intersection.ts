import { filter, map } from '../collection'
import { Nil } from '../interfaces'

/**
 * Creates an array of unique values that are included in all given arrays using SameValueZero for equality comparisons. The order and references of result values are determined by the first array.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 6,183 bytes
 * - Micro-dash: 145 bytes
 */
export function intersection<T>(
  ...arrays: Array<Nil | readonly T[]>
): Promise<T[]> {
  const sets = map(arrays, (array) => new Set(array))
  return filter([...sets[0]], (value) => sets.every((set) => set.has(value)))
}
