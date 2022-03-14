import { flatten } from './flatten'
import { pullAll } from './pull-all'

/**
 * Creates an array of array values not included in the other given arrays. The order and references of result values are determined by the first array.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 6,587 bytes
 * - Micro-dash: 375 bytes
 */
export async function difference<T>(
  array: readonly T[],
  ...values: readonly T[][]
): Promise<T[]> {
  return pullAll(array.slice(), await flatten(values))
}
