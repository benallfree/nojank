import {
  ArrayIteratee,
  ArrayNarrowingIteratee,
  Cast,
  KeyNarrowingIteratee,
  Nil,
  ObjectIteratee,
  ValueNarrowingIteratee,
} from '../interfaces';
import { filter } from './filter';

/**
 * The opposite of `filter`; this method returns the elements of `collection` that `predicate` does **not** return truthy for.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 14,758 bytes
 * - Micro-dash: 379 bytes
 */

export function reject<I, O>(
  array: Nil | readonly I[],
  predicate: ArrayNarrowingIteratee<O>,
): Array<Exclude<I, O>>;
export function reject<T>(
  array: Nil | readonly T[],
  predicate: ArrayIteratee<T, boolean>,
): T[];

export function reject<I, O>(
  object: I | Nil,
  predicate: ValueNarrowingIteratee<I, O>,
): Array<Exclude<I[keyof I], O>>;
export function reject<I, O>(
  object: I | Nil,
  predicate: KeyNarrowingIteratee<I, O>,
): Array<{ [K in keyof I]: Cast<K, string> extends O ? never : I[K] }[keyof I]>;
export function reject<T>(
  object: Nil | T,
  predicate: ObjectIteratee<T, boolean>,
): Array<T[keyof T]>;

export function reject(collection: any, predicate: any): any[] {
  return filter(collection, (value: any, key: any) => !predicate(value, key));
}
