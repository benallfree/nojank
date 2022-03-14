import {
  Cast,
  Evaluate,
  IfCouldBe,
  IfIndexType,
  KeyNarrowingIteratee,
  Nil,
  ObjectIteratee,
  PartialExceptIndexes,
  ValueNarrowingIteratee,
} from '../interfaces';
import { pickBy } from './pick-by';

type IfDefinitelyIncluded<T, O, If, Else = never> = IfCouldBe<T, O, Else, If>;
type IfMaybeIncluded<T, O, If, Else = never> = IfDefinitelyIncluded<
  T,
  O,
  Else,
  Exclude<T, O> extends never ? Else : If
>;
type KeysWithDefinitelyIncludedValues<T, O> = {
  [K in keyof T]: IfDefinitelyIncluded<T[K], O, K>;
}[keyof T];
type KeysWithMaybeIncludedValues<T, O> = {
  [K in keyof T]: IfMaybeIncluded<T[K], O, K>;
}[keyof T];
type DefinitelyIncludedKeys<T, O> = {
  [K in keyof T]: IfIndexType<
    K,
    Exclude<string, O> extends never ? never : K,
    IfDefinitelyIncluded<Cast<K, string>, O, K>
  >;
}[keyof T];
type MaybeIncludedKeys<T, O> = {
  [K in keyof T]: IfIndexType<K, never, IfMaybeIncluded<Cast<K, string>, O, K>>;
}[keyof T];

/**
 * The opposite of `pickBy`; this method creates an object composed of the own enumerable string keyed properties of `object` that `predicate` doesn't return truthy for.
 *
 * Differences from lodash:
 * - does not treat sparse arrays as dense
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 15,669 bytes
 * - Micro-dash: 392 bytes
 */

export function omitBy<T, O>(
  object: Nil | readonly T[],
  predicate: ValueNarrowingIteratee<T[], O>,
): Record<number, Exclude<T, O>>;
export function omitBy<T>(
  object: Nil | readonly T[],
  predicate: ObjectIteratee<T, boolean>,
): Record<number, T>;

export function omitBy<I, T extends NonNullable<I>, O>(
  object: I,
  predicate: ValueNarrowingIteratee<T, O>,
): Evaluate<
  | IfCouldBe<I, Nil, {}>
  | ({
      [K in KeysWithMaybeIncludedValues<T, O>]?: Exclude<T[K], O>;
    } & { [K in KeysWithDefinitelyIncludedValues<T, O>]: Exclude<T[K], O> })
>;
export function omitBy<I, T extends NonNullable<I>, O>(
  object: I,
  predicate: KeyNarrowingIteratee<T, O>,
): Evaluate<
  | IfCouldBe<I, Nil, {}>
  | ({
      [K in DefinitelyIncludedKeys<T, O>]: T[K];
    } & { [K in MaybeIncludedKeys<T, O>]?: T[K] })
>;
export function omitBy<T>(
  object: T,
  predicate: ObjectIteratee<T, boolean>,
): Evaluate<PartialExceptIndexes<NonNullable<T>>>;

export function omitBy(object: any, predicate: Function): any {
  return pickBy(object, (item, key) => !predicate(item, key));
}
