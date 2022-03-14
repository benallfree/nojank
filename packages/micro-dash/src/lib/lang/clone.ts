/**
 * Creates a shallow clone of `value`.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 12,498 bytes
 * - Micro-dash: 117 bytes
 */
export function clone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.slice() as any;
  } else if (value instanceof Object) {
    return { ...value };
  } else {
    return value;
  }
}
