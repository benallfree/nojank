import { Nil } from '../interfaces';

/**
 * Converts the first character of `string` to upper case.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 2,107 bytes
 * - Micro-dash: 119 bytes
 */
export function upperFirst(string: Nil | string): string {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}
