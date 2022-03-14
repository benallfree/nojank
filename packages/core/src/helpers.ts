import { forEachArray } from './forEach'
import { mapArray } from './map'
import { reduceArray } from './reduce'

export const isArray = (o: any): o is [] => Array.isArray(o)

export const map = <I extends {} | [], O>(
  _in: I,
  cb: (
    v: I extends [] ? I[number] : I[keyof I],
    i: I extends [] ? number : keyof I
  ) => O
) => {
  //@ts-ignore
  return isArray(_in) ? mapArray(_in, cb) : {}
}

export const reduce = <I extends {} | [], O>(
  _in: I,
  cb: (
    carry: O,
    v: I extends [] ? I[number] : I[keyof I],
    i: I extends [] ? number : keyof I
  ) => O,
  initial: O
) => {
  //@ts-ignore
  return isArray(_in) ? reduceArray(_in, cb, initial) : {}
}

export const forEach = <I extends {} | []>(
  _in: I,
  cb: (
    v: I extends [] ? I[number] : I[keyof I],
    i: I extends [] ? number : keyof I
  ) => void
) => {
  //@ts-ignore
  return isArray(_in) ? forEachArray(_in, cb) : {}
}
