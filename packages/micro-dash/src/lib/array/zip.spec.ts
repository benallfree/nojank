import { expectTypeOf } from 'expect-type';
import { zip } from './zip';

describe('zip()', () => {
  // hits some code coverage missed by the lodash tests
  it('can zip things with falsey values', () => {
    expect(zip([1, 2], undefined)).toEqual([
      [1, undefined],
      [2, undefined],
    ]);
    expect(zip(null, [3, 4])).toEqual([
      [undefined, 3],
      [undefined, 4],
    ]);
  });

  it('has fancy typing', () => {
    expect().nothing();

    expectTypeOf(zip(['a'], ['yes'])).toEqualTypeOf<Array<[string, string]>>();
    expectTypeOf(zip(['a'], [1, 'no'])).toEqualTypeOf<
      Array<[string, number | string]>
    >();
    expectTypeOf(zip(['a'], [2], [new Date()])).toEqualTypeOf<
      Array<[string, number, Date]>
    >();
    expectTypeOf(zip(['a'], [2], [new Date()], [null])).toEqualTypeOf<
      Array<[string, number, Date, null]>
    >();
    expectTypeOf(zip(['a'], ['b'], ['c'], ['d'], ['e'])).toEqualTypeOf<
      string[][]
    >();
    expectTypeOf(
      zip<number | string>(['a'], [2], ['c'], [4], ['e']),
    ).toEqualTypeOf<Array<Array<number | string>>>();
    expectTypeOf(zip(['a'], null, ['c'], undefined, ['e'])).toEqualTypeOf<
      Array<Array<string | null | undefined>>
    >();
  });

  //
  // stolen from https://github.com/lodash/lodash
  //

  it('should work with no arguments', () => {
    expect(zip()).toEqual([]);
  });

  it('should work with 0-tuples', () => {
    expect(zip([], [])).toEqual([]);
  });

  it('should work with 2-tuples', () => {
    const input = [
      ['barney', 'fred'],
      [36, 40],
    ];
    const actual = zip(['barney', 'fred'], [36, 40]);
    expect(actual).toEqual([
      ['barney', 36],
      ['fred', 40],
    ]);
    expect(zip(...actual)).toEqual(input);
  });

  it('should work with tuples of different lengths', () => {
    const actual1 = zip(['barney', 36], ['fred', 40, false]);
    expect('0' in actual1[2]).toBeTruthy();
    expect(actual1).toEqual([
      ['barney', 'fred'],
      [36, 40],
      [undefined as any, false],
    ]);

    const actual2 = zip(...actual1);
    expect('2' in actual2[0]).toBeTruthy();
    expect(actual2).toEqual([
      ['barney', 36, undefined as any],
      ['fred', 40, false],
    ]);
  });

  it('should treat falsey values as empty arrays', () => {
    expect(zip(null, null, null)).toEqual([]);
    expect(zip(undefined, undefined, undefined)).toEqual([]);
  });

  it('should support consuming its return value', () => {
    expect(zip(...zip(...zip(...zip(['barney', 'fred'], [36, 40]))))).toEqual([
      ['barney', 'fred'],
      [36, 40],
    ]);
  });
});
