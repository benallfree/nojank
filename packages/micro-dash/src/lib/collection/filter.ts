import {
  ArrayIteratee,
  ArrayNarrowingIteratee,
  Cast,
  IfCouldBe,
  KeyNarrowingIteratee,
  Nil,
  ObjectIteratee,
  ValueNarrowingIteratee,
} from '../interfaces'
import { forEach } from './for-each'

/**
 * Iterates over elements of `collection`, returning an array of all elements `predicate` returns truthy for.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 14,451 bytes
 * - Micro-dash: 326 bytes
 */

export async function filter<I, O>(
  array: Nil | readonly I[],
  predicate: ArrayNarrowingIteratee<O>
): Promise<Array<Extract<I, O> | Extract<O, I>>>
export async function filter<T>(
  array: Nil | readonly T[],
  predicate: ArrayIteratee<T, boolean>
): Promise<T[]>

export async function filter<I, O>(
  object: I | Nil,
  predicate: ValueNarrowingIteratee<I, O>
): Promise<Array<Extract<I[keyof I], O> | Extract<O, I[keyof I]>>>
export async function filter<I, O>(
  object: I | Nil,
  predicate: KeyNarrowingIteratee<I, O>
): Promise<
  Array<{ [K in keyof I]: IfCouldBe<Cast<K, string>, O, I[K]> }[keyof I]>
>
export async function filter<T>(
  object: Nil | T,
  predicate: ObjectIteratee<T, boolean>
): Promise<Array<T[keyof T]>>

export async function filter(
  collection: any,
  predicate: Function
): Promise<any[]> {
  const result: any[] = []
  await forEach(collection, (item, indexOrKey) => {
    if (predicate(item, indexOrKey)) {
      result.push(item)
    }
  })
  return result
}
