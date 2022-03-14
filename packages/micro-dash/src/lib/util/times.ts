import { push } from '../../../push'

/**
 * Invokes the iteratee `n` times, returning an array of the results of each invocation.
 *
 * Differences from lodash:
 * - has undefined behavior when given a non natural number for `n`
 * - does not provide a default for `iteratee`
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 1,706 bytes
 * - Micro-dash: 85 bytes
 */
export async function times<T>(
  n: number,
  iteratee: (index: number) => T
): Promise<T[]> {
  const result: T[] = []
  push(function* () {
    for (let i = 0; i < n; ++i) {
      result[i] = iteratee(i)
      yield
    }
  })
  return result
}
