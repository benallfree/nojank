import { push } from './push'

export const forEachArray = <I>(arr: I[], cb: (v: I, i: number) => void) => {
  return push(function* () {
    for (let i = 0; i < arr.length; i++) {
      cb(arr[i], i)
      yield
    }
  })
}
