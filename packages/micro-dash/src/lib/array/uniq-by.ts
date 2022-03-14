import { filter } from '../collection'
import { ValueIteratee } from '../interfaces'

/**
 * This method is like `_.uniq` except that it accepts `iteratee` which is invoked for each element in `array` to generate the criterion by which uniqueness is computed. The order of result values is determined by the order they occur in the array.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 14,845 bytes
 * - Micro-dash: 133 bytes
 */
export async function uniqBy<T>(
  array: readonly T[],
  iteratee: ValueIteratee<T, any>
): Promise<T[]> {
  const seen = new Set<T>()
  return filter(array, (element) => {
    const key = iteratee(element)
    const isNew = !seen.has(key)
    seen.add(key)
    return isNew
  })
}
