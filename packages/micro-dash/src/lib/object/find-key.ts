import {
  ArrayIteratee,
  Cast,
  IfCouldBe,
  Key,
  KeyNarrowingIteratee,
  Narrow,
  Nil,
  ObjectIteratee,
  ValueNarrowingIteratee,
} from '../interfaces';
import { forOwn } from './for-own';

type DefiniteValueMatches<T, O> = {
  [K in keyof T]: T[K] extends O ? K : never;
}[keyof T];
type PossibleValueMatches<T, O> = {
  [K in keyof T]: IfCouldBe<T[K], O, Cast<K, string>>;
}[keyof T];

type DefiniteKeyMatch<T, O> = {
  [K in keyof T]: Cast<K, string> extends O ? K : never;
}[keyof T];
type PossibleKeyMatch<T, O> = {
  [K in keyof T]: IfCouldBe<Cast<K, string>, O, Narrow<Cast<K, string>, O>>;
}[keyof T];

/**
 * This method is like `find` except that it returns the key of the first element `predicate` returns truthy for instead of the element itself.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 14,287 bytes
 * - Micro-dash: 381 bytes
 */

// array
export function findKey<T>(
  array: T[],
  predicate: ArrayIteratee<T, boolean>,
): string | undefined;

// object: value narrowing
export function findKey<I, T extends NonNullable<I>, O>(
  object: I,
  predicate: ValueNarrowingIteratee<T, O>,
):
  | (DefiniteValueMatches<T, O> extends never ? undefined : never)
  | IfCouldBe<I, Nil, undefined>
  | PossibleValueMatches<T, O>;

// object: key narrowing
export function findKey<I, T extends NonNullable<I>, O>(
  object: I,
  predicate: KeyNarrowingIteratee<T, O>,
):
  | (DefiniteKeyMatch<T, O> extends never ? undefined : never)
  | IfCouldBe<I, Nil, undefined>
  | PossibleKeyMatch<T, O>;

// object
export function findKey<T>(
  object: Nil | T,
  predicate: ObjectIteratee<T, boolean>,
): Cast<keyof T, string> | undefined;

export function findKey<T>(object: T, predicate: Function): Key | undefined {
  let found;
  forOwn(object, (value, key) => {
    if (predicate(value, key)) {
      found = key;
      return false;
    }
    return undefined;
  });
  return found;
}
