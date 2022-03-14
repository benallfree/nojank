import { push } from '../../../push'
import { compareValues } from '../collection/sort-by'
import { Nil } from '../interfaces'

/**
 * Uses a binary search to determine the lowest index at which `value` should be inserted into `array` in order to maintain its sort order.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 1,344 bytes
 * - Micro-dash: 295 bytes
 */
export async function sortedIndex<T>(
  array: Nil | readonly T[],
  value: T
): Promise<number> {
  let min = 0
  let max = array ? array.length - 1 : 0
  await push(function* () {
    while (max > min) {
      const mid = Math.floor((max + min) / 2)
      if (compareValues(array![mid], value) < 0) {
        min = mid + 1
      } else {
        max = mid
      }
    }
    yield
  })
  return min
}
