import { nojank } from '.'

const jankForMs = (ms = 200) => {
  const start = Date.now()
  while (true) {
    const end = Date.now()
    if (end - start > ms) break
  }
}
const jankThenReturnControlToEventLoop = (ms = 200) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
    jankForMs(ms)
  })
}

const mkCounter = () => {
  let i = 0
  return jest.fn(() => i++)
}

const { reset, watchdog, run } = nojank()

beforeEach(() => {})

afterEach(() => {
  reset()
})

test('start/pause/stop and onJank', async () => {
  let jankCount = 0
  const unsub = watchdog.onJank((ms) => jankCount++)
  watchdog.start()
  expect(jankCount).toBe(0)
  await jankThenReturnControlToEventLoop()
  expect(jankCount).toBe(1)
  watchdog.pause()
  await jankThenReturnControlToEventLoop()
  expect(jankCount).toBe(1)
  watchdog.start()
  await jankThenReturnControlToEventLoop()
  expect(jankCount).toBe(2)
  unsub()
  watchdog.onJank(() => {})
  await jankThenReturnControlToEventLoop()
  expect(jankCount).toBe(2)
})

test('watchdog', async () => {
  let jankCount = 0
  watchdog.onJank(({ ms, watchId }) => {
    if (watchId === 'jank') jankCount++
  })
  const res = watchdog.isolate(() => true, 'nojank')
  expect(res).toBeTruthy()
  expect(jankCount).toBe(0)
  watchdog.isolate(jankForMs, 'jank')
  expect(jankCount).toBe(1)
})

test('run', async () => {
  const count = mkCounter()
  const err = jest.fn()

  /**
   * Test success
   */
  try {
    await run(count)
  } catch (e) {
    err()
  }
  expect(count.mock.calls.length).toBe(1)
  expect(count.mock.results[0]?.value).toBe(0)
  expect(err.mock.calls.length).toBe(0)

  // /**
  //  * Test error
  //  */
  // try {
  //   await run(() => {
  //     throw new Error(`oops`)
  //   })
  // } catch (e) {
  //   err()
  // }
  // expect(count.mock.calls.length).toBe(1)
  // expect(count.mock.results[0]?.value).toBe(0)
  // expect(err.mock.calls.length).toBe(1)

  // /**
  //  * Test multiple
  //  */
  // const res = await Promise.all([run(() => 1), run(() => 2), run(() => 3)])
  // expect(count.mock.calls.length).toBe(1)
  // expect(count.mock.results[0]?.value).toBe(0)
  // expect(err.mock.calls.length).toBe(1)
  // expect(res).toStrictEqual([1, 2, 3])
})

// test('config', async () => {
//   expect(() => nojank({ sliceMs: 0 })).toThrow()
//   expect(() => nojank({ sliceMs: 1000 })).toThrow()

//   expect(() => nojank({ warnMs: 0 })).toThrow()
//   expect(() => nojank({ warnMs: 1200 })).toThrow()
// })

// test('watchdog', async () => {
//   /**
//    * Test watchdog janks
//    */
//   const counter = mkCounter()
//   const { watchdog } = nojank({ warnMs: 100 })
//   watchdog.start()
//   expect(counter).toBeCalledTimes(0)
//   await jankThenReturnControlToEventLoop()
//   expect(counter).toBeCalledTimes(1)
//   expect(counter).lastReturnedWith(0)
// })

// test('The warning message differentiates between jank inside its processing queue vs jank coming from unknown code.', async () => {
//   const counter = jest.fn((payload: OnJankPayload) => {})
//   const { watchdog, run } = nojank({ warnMs: 100 })
//   watchdog.onJank(counter)
//   watchdog.start()
//   expect(counter).toBeCalledTimes(0)
//   await jankThenReturnControlToEventLoop()
//   expect(counter).toBeCalledTimes(1)
//   expect(counter.mock.calls[0]?.[0]).toMatchObject({ watchId: 'unknown' })
//   await run((ctx) => jankForMs())
//   expect(counter).toBeCalledTimes(2)
//   expect(counter.mock.calls[1]?.[0]).toMatchObject({ watchId: 'slice20' })
// })

// test('swimlanes', async () => {
//   /**
//    * Two separate swimlanes
//    */
//   const res: number[] = []
//   await Promise.all([
//     run(() => res.push(1)),
//     run(() => res.push(2)),
//     run(() => res.push(3)),
//     run(() => res.push(4), { lane: 'second' }),
//     run(() => res.push(5), { lane: 'second' }),
//     run(() => res.push(6), { lane: 'second' }),
//   ])
//   expect(res).toStrictEqual([1, 4, 2, 5, 3, 6])
// })

// test('jobs continue after failed job', async () => {
//   const res: number[] = []
//   await Promise.all([
//     run(() => {
//       throw new Error(`foo`)
//     }).catch((e) => {}), // Catch so the Promise.all succeeds
//     run(() => res.push(2)),
//     run(() => res.push(3)),
//   ])
//   expect(res).toStrictEqual([2, 3])
// })

// test('swimlanes have priorities', async () => {
//   /**
//    * Two separate swimlanes
//    */
//   const { run } = nojank({
//     lanes: {
//       critical: {
//         priority: 999,
//       },
//     },
//   })

//   const res: number[] = []
//   await Promise.all([
//     run(() => res.push(1)),
//     run(() => res.push(2)),
//     run(() => res.push(3)),
//     run(() => res.push(4), { lane: 'critical' }),
//     run(() => res.push(5), { lane: 'critical' }),
//     run(() => res.push(6), { lane: 'critical' }),
//   ])
//   expect(res).toStrictEqual([4, 5, 6, 1, 2, 3])
// })

// test(`
// nojank stays out of the way by using idle time to execute jobs. If it detects that the thread is busy with other work, nojank will reduce its processing time to compensate.`, () => {})

// test('use array helpers', async () => {
//   const strings = [...Array(20).keys()].map((n) => `${n}`)
//   const myExpensiveFunc = (s: string) => {
//     jankForMs(10)
//     return s
//   }

//   const counter = jest.fn((payload: OnJankPayload) => {})
//   onJank(counter)
//   config({ warnMs: 100 })
//   start()

//   /**
//    * Janky
//    */
//   const res1 = await doSomethingJanky(() =>
//     strings.map((s) => myExpensiveFunc(s))
//   )
//   expect(counter).toBeCalledTimes(1)
//   expect(counter.mock.calls[0][0]).toMatchObject({ watchId: 'unknown' })
//   expect(res1).toStrictEqual(strings)

//   /**
//    * Promise flood
//    */
//   const res2 = await Promise.all(
//     strings.map((s) => push(() => myExpensiveFunc(s)))
//   )
//   expect(counter).toBeCalledTimes(1)
//   expect(res2).toStrictEqual(strings)

//   /**
//    * Promise chain
//    */
//   const res3 = await strings.reduce((carry, s) => {
//     return carry.then((arr) =>
//       push(() => myExpensiveFunc(s)).then((res) => {
//         arr.push(res)
//         return arr
//       })
//     )
//   }, Promise.resolve<string[]>([]))
//   expect(counter).toBeCalledTimes(1)
//   expect(res3).toStrictEqual(strings)

//   /**
//    * Generator
//    */
//   const res4 = await push(function* () {
//     const res: string[] = []
//     for (let i = 0; i < strings.length; i++) {
//       res.push(myExpensiveFunc(strings[i]))
//       yield
//     }
//     return res
//   })
//   expect(counter).toBeCalledTimes(1)
//   expect(res4).toStrictEqual(strings)

//   /**
//    * Map helper
//    */
//   const res5 = await map(strings, myExpensiveFunc)
//   expect(counter).toBeCalledTimes(1)
//   expect(res5).toStrictEqual(strings)

//   /**
//    * Reduce helper
//    */
//   const res6 = await reduce(
//     strings,
//     (carry, v) => {
//       carry.push(myExpensiveFunc(v))
//       return carry
//     },
//     [] as string[]
//   )
//   expect(counter).toBeCalledTimes(1)
//   expect(res6).toStrictEqual(strings)

//   /**
//    * forEach helper
//    */
//   const res7: string[] = []
//   await forEach(strings, (v) => {
//     res7.push(myExpensiveFunc(v))
//   })
//   expect(counter).toBeCalledTimes(1)
//   expect(res6).toStrictEqual(strings)
// })

// test('use object helpers', async () => {
//   const strings = [...Array(20).keys()].map((n) => `${n}`)

//   const obj = strings.reduce((c, n) => {
//     c[n] = n
//     return c
//   }, {} as { [_: string]: string })

//   const myExpensiveFunc = (s: string) => {
//     jankForMs(10)
//     return s
//   }

//   const counter = jest.fn((payload: OnJankPayload) => {})
//   onJank(counter)
//   config({ warnMs: 100 })
//   start()

//   /**
//    * Janky
//    */
//   const obj1: typeof obj = {}
//   await doSomethingJanky(() =>
//     Object.keys(obj).forEach((s) => (obj1[s] = myExpensiveFunc(s)))
//   )
//   expect(counter).toBeCalledTimes(1)
//   expect(counter.mock.calls[0][0]).toMatchObject({ watchId: 'unknown' })
//   expect(obj1).toMatchObject(obj)

//   /**
//    * Promise flood
//    */
//   const res2 = await Promise.all(
//     Object.keys(obj).map((s) => push(() => myExpensiveFunc(s)))
//   )
//   const obj2 = res2.reduce((carry, v) => {
//     carry[v] = v
//     return carry
//   }, {} as typeof obj)
//   expect(counter).toBeCalledTimes(1)
//   expect(obj2).toMatchObject(obj)

//   /**
//    * Promise chain
//    */
//   const res3 = await Object.keys(obj).reduce((carry, s) => {
//     return carry.then((o) =>
//       push(() => myExpensiveFunc(s)).then((res) => {
//         o[s] = res
//         return o
//       })
//     )
//   }, Promise.resolve<typeof obj>({}))
//   expect(counter).toBeCalledTimes(1)
//   expect(res3).toMatchObject(obj)

//   /**
//    * Generator
//    */
//   const res4 = await push(function* () {
//     const res: typeof obj = {}
//     for (let i = 0; i < strings.length; i++) {
//       res[strings[i]] = myExpensiveFunc(strings[i])
//       yield
//     }
//     return res
//   })
//   expect(counter).toBeCalledTimes(1)
//   expect(res4).toMatchObject(obj)

//   /**
//    * Map helper
//    */
//   const res5 = await map(obj, myExpensiveFunc)
//   expect(counter).toBeCalledTimes(1)
//   expect(res5).toStrictEqual(strings)

//   /**
//    * Reduce helper
//    */
//   const res6 = await reduce(
//     obj,
//     (carry, v) => {
//       carry[v] = myExpensiveFunc(v)
//       return carry
//     },
//     {} as typeof obj
//   )
//   expect(counter).toBeCalledTimes(1)
//   expect(res6).toMatchObject(obj)

//   /**
//    * forEach helper
//    */
//   const res7: typeof obj = {}
//   await forEach(obj, (v) => {
//     res7[v] = myExpensiveFunc(v)
//   })
//   expect(counter).toBeCalledTimes(1)
//   expect(res6).toMatchObject(obj)
// })

// test('processes job', async () => {
//   let jobCount: number[] = []
//   const { push, stop } = nojank({
//     // The worker callback to use. This must handle all job types, which should be implemented in your custom job type.
//   })
//   await push(function* () {
//     const res: number[] = []
//     const nums = [1, 2, -1, 3]
//     for (let i = 0; i < nums.length; i++) {
//       res.push(nums[i])
//       yield res
//     }
//     return res
//   })

//   stop()
// })
