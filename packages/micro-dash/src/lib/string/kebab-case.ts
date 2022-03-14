import { toLower } from './to-lower';
import { words } from './words';

/**
 * Converts `string` to [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 5,043 bytes
 * - Micro-dash: 285 bytes
 */
export function kebabCase(string: string): string {
  return words(string).map(toLower).join('-');
}
