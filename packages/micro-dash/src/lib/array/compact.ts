import { Falsey } from 'utility-types'
import { filter } from '../collection'

/**
 * Creates an array with all falsey values removed. The values `false`, `null`, `0`, `""`, `undefined`, and `NaN` are falsey.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 114 bytes
 * - Micro-dash: 53 bytes
 */
export function compact<T>(
  array: readonly T[]
): Promise<Array<Exclude<T, Falsey>>> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- not sure why this rule triggers
  return filter(array, (v) => !!v) as Promise<Array<Exclude<T, Falsey>>>
}
