import { push } from '../../../push'

/**
 * Flattens `array` a single level deep.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 1,264 bytes
 * - Micro-dash: 127 bytes
 */
export async function flatten<T>(
  array: ReadonlyArray<T | readonly T[]>
): Promise<T[]> {
  const result: any[] = []
  await push(function* () {
    for (const element of array) {
      if (Array.isArray(element)) {
        for (const inner of element) {
          result.push(inner)
        }
      } else {
        result.push(element)
      }
      yield
    }
  })
  return result
}
