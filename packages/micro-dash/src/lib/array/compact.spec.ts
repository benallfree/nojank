import { compact } from './compact';

describe('compact()', () => {
  it('should filter falsey values', () => {
    expect(
      compact([, null, undefined, false, 0, NaN, '', '0', '1', '2']),
    ).toEqual(['0', '1', '2']);
  });

  it('is OK when there are no falsey values', () => {
    expect(compact([1, 2])).toEqual([1, 2]);
  });

  it('is OK with all falsey values', () => {
    expect(compact([false, null, '']) as any[]).toEqual([]);
  });

  it('is OK with an empty array', () => {
    expect(compact([])).toEqual([]);
  });

  it('fancily narrows the type', () => {
    const before: Array<number | '' | false | null | undefined> = [
      1,
      2,
      false,
      null,
      undefined,
      0,
      '',
      3,
    ];
    const after: number[] = compact(before);
    expect(after).toEqual([1, 2, 3]);
  });
});
