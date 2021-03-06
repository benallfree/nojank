/**
 * Pads `string` on the right side if it's shorter than `length`. Padding characters are truncated if they exceed `length`.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 3,609 bytes
 * - Micro-dash: 97 bytes
 */
export function padEnd(s: string, length: number, chars?: string): string {
  return s.padEnd(length, chars);
}
