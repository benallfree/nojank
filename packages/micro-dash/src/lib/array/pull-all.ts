import { push } from '../../../push'
import { remove } from './remove'

/**
 * This method is like `pull` except that it accepts an array of values to remove.
 *
 * **Note:** Unlike `difference`, this method mutates array.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 855 bytes
 * - Micro-dash: 222 bytes
 */
export async function pullAll<T>(array: T[], values: T[]): Promise<T[]> {
  await push(async function* () {
    for (const value of values.slice()) {
      await remove(array, (item: T) => Object.is(item, value))
      yield
    }
  })
  return array
}
