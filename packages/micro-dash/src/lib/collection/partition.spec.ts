import { expectCallsAndReset } from '@s-libs/ng-dev'
import { expectTypeOf } from 'expect-type'
import {
  identity,
  isDate,
  isMap,
  isString,
  stubFalse,
  stubTrue,
} from 'lodash-es'
import {
  isA,
  isDateOrString,
  isMapOrString,
  isNumberOrString,
  isStringOr2,
} from '../../test-helpers/test-utils'
import { partition } from './partition'

describe('partition', () => {
  it('can handle null/undefined collections', () => {
    expect(partition(null, identity)).toEqual([[], []])
    expect(partition(undefined, identity)).toEqual([[], []])
  })

  it('has fancy typing for arrays', () => {
    expect().nothing()

    type A = Array<number | string>
    const a = [] as A
    const aOrU = a as A | undefined
    const aOrN = a as A | null

    expectTypeOf(partition(a, () => true)).toEqualTypeOf<
      [Array<number | string>, Array<number | string>]
    >()
    expectTypeOf(partition(aOrU, () => true)).toEqualTypeOf<
      [Array<number | string>, Array<number | string>]
    >()
    expectTypeOf(partition(aOrN, () => true)).toEqualTypeOf<
      [Array<number | string>, Array<number | string>]
    >()

    // narrowing

    expectTypeOf(partition(a, isString)).toEqualTypeOf<[string[], number[]]>()
    expectTypeOf(partition(aOrU, isString)).toEqualTypeOf<
      [string[], number[]]
    >()
    expectTypeOf(partition(aOrN, isString)).toEqualTypeOf<
      [string[], number[]]
    >()

    expectTypeOf(partition(a, isDateOrString)).toEqualTypeOf<
      [string[], number[]]
    >()
    expectTypeOf(partition(aOrU, isDateOrString)).toEqualTypeOf<
      [string[], number[]]
    >()
    expectTypeOf(partition(aOrN, isDateOrString)).toEqualTypeOf<
      [string[], number[]]
    >()

    expectTypeOf(partition(a, isA)).toEqualTypeOf<
      [Array<'a'>, Array<number | string>]
    >()
    expectTypeOf(partition(aOrU, isA)).toEqualTypeOf<
      [Array<'a'>, Array<number | string>]
    >()
    expectTypeOf(partition(aOrN, isA)).toEqualTypeOf<
      [Array<'a'>, Array<number | string>]
    >()

    type AB = Array<'a' | 'b'>
    const ab = [] as AB
    const abOrU = ab as AB | undefined
    const abOrN = ab as AB | null

    expectTypeOf(partition(ab, isA)).toEqualTypeOf<[Array<'a'>, Array<'b'>]>()
    expectTypeOf(partition(abOrU, isA)).toEqualTypeOf<
      [Array<'a'>, Array<'b'>]
    >()
    expectTypeOf(partition(abOrN, isA)).toEqualTypeOf<
      [Array<'a'>, Array<'b'>]
    >()

    expectTypeOf(partition(ab, isString)).toEqualTypeOf<
      [Array<'a' | 'b'>, []]
    >()
    expectTypeOf(partition(abOrU, isString)).toEqualTypeOf<
      [Array<'a' | 'b'>, []]
    >()
    expectTypeOf(partition(abOrN, isString)).toEqualTypeOf<
      [Array<'a' | 'b'>, []]
    >()

    type AN = Array<number | 'a'>
    const an = [] as AN
    const anOrU = an as AN | undefined
    const anOrN = an as AN | null
    expectTypeOf(partition(an, isStringOr2)).toEqualTypeOf<
      [Array<'a' | 2>, number[]]
    >()
    expectTypeOf(partition(anOrU, isStringOr2)).toEqualTypeOf<
      [Array<'a' | 2>, number[]]
    >()
    expectTypeOf(partition(anOrN, isStringOr2)).toEqualTypeOf<
      [Array<'a' | 2>, number[]]
    >()
  })

  it('has fancy typing for objects', () => {
    expect().nothing()

    interface O {
      a: number
      2: string
      c: Date | Document
    }
    const o = {} as O
    const oOrN = o as O | null
    const oOrU = o as O | undefined
    type AllOTypes = Date | Document | number | string
    expectTypeOf(partition(o, () => true)).toEqualTypeOf<
      [AllOTypes[], AllOTypes[]]
    >()
    expectTypeOf(partition(oOrN, () => true)).toEqualTypeOf<
      [AllOTypes[], AllOTypes[]]
    >()
    expectTypeOf(partition(oOrU, () => true)).toEqualTypeOf<
      [AllOTypes[], AllOTypes[]]
    >()

    // value narrowing

    expectTypeOf(partition(o, isString)).toEqualTypeOf<
      [string[], Array<Date | Document | number>]
    >()
    expectTypeOf(partition(oOrU, isString)).toEqualTypeOf<
      [string[], Array<Date | Document | number>]
    >()
    expectTypeOf(partition(oOrN, isString)).toEqualTypeOf<
      [string[], Array<Date | Document | number>]
    >()

    expectTypeOf(partition(o, isDate)).toEqualTypeOf<
      [Date[], Array<Document | number | string>]
    >()
    expectTypeOf(partition(oOrU, isDate)).toEqualTypeOf<
      [Date[], Array<Document | number | string>]
    >()
    expectTypeOf(partition(oOrN, isDate)).toEqualTypeOf<
      [Date[], Array<Document | number | string>]
    >()

    expectTypeOf(partition(o, isNumberOrString)).toEqualTypeOf<
      [Array<number | string>, Array<Date | Document>]
    >()
    expectTypeOf(partition(oOrU, isNumberOrString)).toEqualTypeOf<
      [Array<number | string>, Array<Date | Document>]
    >()
    expectTypeOf(partition(oOrN, isNumberOrString)).toEqualTypeOf<
      [Array<number | string>, Array<Date | Document>]
    >()

    expectTypeOf(partition(o, isDateOrString)).toEqualTypeOf<
      [Array<Date | string>, Array<Document | number>]
    >()
    expectTypeOf(partition(oOrU, isDateOrString)).toEqualTypeOf<
      [Array<Date | string>, Array<Document | number>]
    >()
    expectTypeOf(partition(oOrN, isDateOrString)).toEqualTypeOf<
      [Array<Date | string>, Array<Document | number>]
    >()

    expectTypeOf(partition(o, isMap)).toEqualTypeOf<[[], AllOTypes[]]>()
    expectTypeOf(partition(oOrU, isMap)).toEqualTypeOf<[[], AllOTypes[]]>()
    expectTypeOf(partition(oOrN, isMap)).toEqualTypeOf<[[], AllOTypes[]]>()

    expectTypeOf(partition(o, isMapOrString)).toEqualTypeOf<
      [string[], Array<Date | Document | number>]
    >()
    expectTypeOf(partition(oOrU, isMapOrString)).toEqualTypeOf<
      [string[], Array<Date | Document | number>]
    >()
    expectTypeOf(partition(oOrN, isMapOrString)).toEqualTypeOf<
      [string[], Array<Date | Document | number>]
    >()

    interface S2 {
      a: number | 'a'
    }
    const s2 = {} as S2
    const s2OrN = s2 as S2 | null
    const s2OrU = s2 as S2 | undefined

    expectTypeOf(partition(s2, isA)).toEqualTypeOf<[Array<'a'>, number[]]>()
    expectTypeOf(partition(s2OrU, isA)).toEqualTypeOf<[Array<'a'>, number[]]>()
    expectTypeOf(partition(s2OrN, isA)).toEqualTypeOf<[Array<'a'>, number[]]>()

    expectTypeOf(partition(s2, isStringOr2)).toEqualTypeOf<
      [Array<'a' | 2>, number[]]
    >()
    expectTypeOf(partition(s2OrU, isStringOr2)).toEqualTypeOf<
      [Array<'a' | 2>, number[]]
    >()
    expectTypeOf(partition(s2OrN, isStringOr2)).toEqualTypeOf<
      [Array<'a' | 2>, number[]]
    >()
  })

  //
  // stolen from https://github.com/lodash/lodash
  //

  const array = [1, 0, 1]

  it('should split elements into two groups by `predicate`', () => {
    expect(partition([], identity)).toEqual([[], []])
    expect(partition(array, stubTrue)).toEqual([array, []])
    expect(partition(array, stubFalse)).toEqual([[], array])
  })

  it('should work with an object for `collection`', () => {
    expect(partition({ a: 1.1, b: 0.2, c: 1.3 }, Math.floor)).toEqual([
      [1.1, 1.3],
      [0.2],
    ])
  })

  it('should provide correct iteratee arguments', () => {
    const spy = jasmine.createSpy()
    partition([1, 2, 3], spy)
    expect(spy.calls.first().args).toEqual([1])
  })

  it('iterates over own string keyed properties of objects', () => {
    const object = { a: 1 }
    const spy = jasmine.createSpy()

    partition(object, spy)

    expectCallsAndReset(spy, [1])
  })

  it('should ignore changes to `length`', () => {
    const shortArray = [1]
    const spy = jasmine.createSpy().and.callFake(() => {
      shortArray.push(2)
      return true
    })

    partition(shortArray, spy)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should ignore added `object` properties', () => {
    const object: any = { a: 1 }
    const spy = jasmine.createSpy().and.callFake(() => {
      object.b = 2
      return true
    })

    partition(object, spy)

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
