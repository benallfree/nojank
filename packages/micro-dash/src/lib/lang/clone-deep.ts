import { forOwn } from '../object';
import { clone } from './clone';

/**
 * This method is like `clone` except that it recursively clones `value`.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 12,498 bytes
 * - Micro-dash: 420 bytes
 */
export function cloneDeep<T>(value: T): T {
  if (value instanceof Object) {
    value = clone(value);
    forOwn(value, (item, key) => {
      value[key as keyof T] = cloneDeep(item);
    });
  }
  return value;
}
