/**
 * Converts `value` to a string. An empty string is returned for `null` and `undefined` values.
 *
 * Differences:
 * - `null` and `undefined` array references are blank
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 1,105 bytes
 * - Micro-dash: 102 bytes
 */
export function toString(value: any): string {
  return [value].toString();
}
