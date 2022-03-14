import { ArrayIteratee, ObjectIteratee } from '../interfaces'
import { forEach } from './for-each'

/**
 * Checks if `predicate` returns truthy for **all** elements of `collection`. Iteration is stopped once predicate returns falsey.
 *
 * **Note:** This method returns `true` for [empty collections](https://en.wikipedia.org/wiki/Empty_set) because [everything is true](https://en.wikipedia.org/wiki/Vacuous_truth) of elements of empty collections.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 14,709 bytes
 * - Micro-dash: 328 bytes
 */

export function every<T>(
  array: readonly T[] | undefined,
  predicate: ArrayIteratee<T, any>
): Promise<boolean>
export function every<T>(
  object: T | undefined,
  predicate: ObjectIteratee<T, any>
): Promise<boolean>

export async function every(collection: any, predicate: any): Promise<boolean> {
  let result = true
  await forEach(
    collection,
    (value, keyOrIndex) => (result = !!predicate(value, keyOrIndex))
  )
  return result
}
