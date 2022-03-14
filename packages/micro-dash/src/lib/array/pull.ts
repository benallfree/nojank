import { pullAll } from './pull-all'

/**
 * Removes all given values from array using `SameValueZero` for equality comparisons.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 3,238 bytes
 * - Micro-dash: 201 bytes
 */
export async function pull<T>(array: T[], ...values: T[]): Promise<T[]> {
  return pullAll(array, values)
}
