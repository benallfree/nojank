import { push } from '../../../push'
import { map, sortBy } from '../collection'
import { flatten } from './flatten'

/**
 * Removes elements from array corresponding to indexes and returns an array of removed elements.
 *
 * *Note:* This method mutates `array`.
 *
 * Differences from lodash:
 * - behavior is undefined when attempting to pull attributes keyed with anything other than positive integers
 * - does not support deep paths
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 8,077 bytes
 * - Micro-dash: 311 bytes
 */
export async function pullAt(
  array: any[],
  ...indexes: Array<number[] | number>
): Promise<any[]> {
  const flattenedIndexes = await flatten(indexes)
  const result = map(flattenedIndexes, (i) => array[i])

  let lastI: number | undefined
  const sorted = sortBy(flattenedIndexes, (a) => a)
  await push(function* () {
    for (const i of sorted) {
      if (i !== lastI) {
        array.splice(i, 1)
      }
      lastI = i
      yield
    }
  })

  return result
}
