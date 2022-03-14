import { Nil, ObjectWith, ValueIteratee } from '../interfaces';
import { castArray } from '../lang';
import { map } from './map';

/**
 * Creates an array of elements, sorted in ascending order by the results of running each element in a collection thru each iteratee. This method performs a stable sort, that is, it preserves the original sort order of equal elements.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 16,634 bytes
 * - Micro-dash: 684 bytes
 */
export function sortBy<T>(
  collection: Nil | ObjectWith<T> | readonly T[],
  iteratees: Array<ValueIteratee<T, any>> | ValueIteratee<T, any>,
): T[] {
  const fns = castArray(iteratees);
  const metas = map(collection, (value: any) =>
    Object.assign(
      fns.map((fn) => fn(value)),
      { value },
    ),
  );

  metas.sort((m1, m2) => {
    for (let i = 0; i < m1.length; ++i) {
      const comp = compareValues(m1[i], m2[i]);
      if (comp) {
        return comp;
      }
    }
    return undefined;
  });

  return metas.map((e) => e.value);
}

export const compareValues = (x: any, y: any): any => {
  let v1 = getSortOrdinal(x);
  let v2 = getSortOrdinal(y);
  if (v1 === v2) {
    v1 = x;
    v2 = y;
  }
  if (v1 < v2) {
    return -1;
  } else if (v1 > v2) {
    return 1;
  }
  return undefined;
};

const getSortOrdinal = (value: any): number => {
  if (Number.isNaN(value)) {
    return 3;
  }
  if (value === undefined) {
    return 2;
  }
  if (value === null) {
    return 1;
  }
  return 0;
};
