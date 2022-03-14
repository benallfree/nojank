import { filter } from '../collection'
import { Nil, StringifiedKey } from '../interfaces'

/**
 * Creates an array of the own enumerable property names of object.
 *
 * Differences from lodash:
 * - does not give any special consideration for arguments objects, strings, or prototype objects (e.g. many will have `'length'` in the returned array)
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 3,430 bytes
 * - Micro-dash: 182 bytes
 */

export async function keys<T>(
  object: Nil | T
): Promise<Array<StringifiedKey<T>>> {
  let val = keysOfNonArray(object)
  if (Array.isArray(object)) {
    val = await filter(val, (item) => item !== 'length')
  }
  return val as any
}

export function keysOfNonArray<T>(object: Nil | T): Array<StringifiedKey<T>> {
  return object ? (Object.getOwnPropertyNames(object) as any) : []
}
