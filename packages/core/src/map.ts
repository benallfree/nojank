import { run } from './run'

export const mapArray = <I, O>(arr: I[], cb: (v: I, i: number) => O) => {
  return run(function* () {
    const res: O[] = []
    for (let i = 0; i < arr.length; i++) {
      res.push(cb(arr[i]!, i))
      yield
    }
    return res
  })
}
