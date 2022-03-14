import { nojank } from '../src'

/**
 * Suppose we have one million strings and want to
 * calculate md5 hashes of each one.
 */
const MY_MASSIVE_ARRAY = [
  'string1',
  'string2',
  // ...
]

/**
 * We could do this, but jank would be terrible
 */
const hashes = MY_MASSIVE_ARRAY.map((input) => md5(input).toString())

/**
 * Let's solve it instead using nojank
 */
const { push, stop } = nojank<string>({
  worker: md5,
})

const hashes = Promise.all(MY_MASSIVE_ARRAY.map((input) => push))
