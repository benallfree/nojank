import { run } from './run'

export const reduceArray = <I, O>(
  arr: I[],
  cb: (carry: O, v: I, i: number) => O,
  initial: O
) => {
  return run(function* () {
    let _carry: O = initial
    for (let i = 0; i < arr.length; i++) {
      _carry = cb(_carry, arr[i]!, i)
      yield
    }
    return _carry
  })
}
