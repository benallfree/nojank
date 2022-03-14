import { Nil } from '../interfaces';
import { clone } from '../lang';

type RemainingKeys<T, Omits> =
  | Exclude<keyof T, Omits>
  | Extract<PropertyKey, keyof T>; // always include index properties

/**
 * The opposite of `pick`; this method creates an object composed of the own enumerable string properties of object that are not omitted.
 *
 * Differences from lodash:
 * - `paths` must be direct keys of `object` (they cannot refer to deeper properties)
 * - does not work with arrays
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 16,006 bytes
 * - Micro-dash: 170 bytes
 */
export function omit<T extends Nil | object, O extends ReadonlyArray<keyof T>>(
  object: T,
  ...paths: O
): {
  [K in RemainingKeys<T, O[number]>]: T[K];
} {
  const obj: any = clone(object) || {};
  for (const path of paths) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- well, this is exactly what the user requested, so ...
    delete obj[path];
  }
  return obj;
}
