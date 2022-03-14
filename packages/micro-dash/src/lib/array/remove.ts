import { push } from '../../../push'
import { ArrayIteratee, ArrayNarrowingIteratee } from '../interfaces'

/**
 * Removes all elements from array for which `predicate` returns truthy, and returns an array of the removed elements.
 *
 * Differences from lodash:
 * - iterates over `array` in reverse order
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 14,577 bytes
 * - Micro-dash: 128 bytes
 */

export async function remove<I, O>(
  array: I[],
  predicate: ArrayNarrowingIteratee<O>
): Promise<O[]> // TODO: could be narrower?
export async function remove<T>(
  array: T[],
  predicate: ArrayIteratee<T, boolean>
): Promise<T[]>

export async function remove<T>(
  array: T[],
  predicate: ArrayIteratee<T, boolean>
): Promise<T[]> {
  const removed: T[] = []
  await push(function* () {
    for (let i = array.length; --i >= 0; ) {
      if (predicate(array[i], i)) {
        removed.unshift(array[i])
        array.splice(i, 1)
      }
      yield
    }
  })
  return removed
}
