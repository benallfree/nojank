import { DEFAULT_SWIMLANE_NAME } from '../index'
import { UnixMilliseconds, WatchdogService } from '../watchdog'
import { createPoolManager, LaneName, PoolId } from './pools'

export type RuntimeContext = {
  shouldYield: boolean
  expiry: UnixMilliseconds
}

export type RuntimeContextProvider = () => RuntimeContext

export type RunGeneratorCallback<TResult> = (
  context: RuntimeContextProvider
) => Generator<TResult, TResult, RuntimeContextProvider>
export type RunFunctionCallback<TResult> = (
  context: RuntimeContextProvider
) => TResult
export type RunCallbackIn<TResult> =
  | RunGeneratorCallback<TResult>
  | RunFunctionCallback<TResult>

export type RunConfig = {
  lane: string | typeof DEFAULT_SWIMLANE_NAME
}

export type Job = {
  laneName: string
  generator: RunGeneratorCallback<any>
  iterator: (
    contextProvider: RuntimeContextProvider
  ) => Generator<any, any, RuntimeContextProvider>
  resolve: (res: any) => void
  reject: (error: any) => void
}

export const isGenerator = (
  cb: RunCallbackIn<any>
): cb is RunGeneratorCallback<any> => {
  return cb.prototype?.toString() === '[object Generator]'
}

export type RuntimeProvider = {
  sliceMs: () => number
  getPoolIdByLaneName: (name: LaneName) => PoolId
  watchdog: WatchdogService
}

export const createRuntime = (runtimeProvider: RuntimeProvider) => {
  let isWorking = false

  let pools: ReturnType<typeof createPoolManager>

  const clear = () => {
    isWorking = false
    pools = createPoolManager(runtimeProvider)
  }

  const { sliceMs, watchdog } = runtimeProvider

  let _limit = 0

  const protectedContext: RuntimeContextProvider = () => ({
    shouldYield: Date.now() >= _limit,
    expiry: _limit,
  })

  const _work = () => {
    if (!isWorking) return
    _limit = Date.now() + sliceMs()
    while (Date.now() < _limit) {
      const job = pools.nextJob()
      if (!job) {
        isWorking = false
        break
      }
      const { iterator, resolve, reject, laneName } = job
      try {
        const { done, value } = watchdog.isolate(
          () => iterator(protectedContext).next(),
          `slice${sliceMs}:${laneName}`,
          _limit - Date.now()
        )
        if (done) {
          setImmediate(() => resolve(value))
        }
      } catch (error: any) {
        setImmediate(() => reject(error))
      }
    }
    if (isWorking) {
      setImmediate(_work)
    }
  }

  const work = () => {
    if (isWorking) return
    isWorking = true
    setImmediate(_work)
  }

  const run = <TResult>(
    nibble: RunCallbackIn<TResult>,
    config?: Partial<RunConfig>
  ): Promise<TResult> => {
    const _config: RunConfig = {
      lane: DEFAULT_SWIMLANE_NAME,
      ...config,
    }

    const generator: RunGeneratorCallback<TResult> = isGenerator(nibble)
      ? nibble
      : function* (contextProvider: RuntimeContextProvider) {
          return nibble(contextProvider)
        }
    const p = new Promise<TResult>((resolve, reject) => {
      let _i: Generator
      const newNode: Job = {
        laneName: _config.lane,
        resolve,
        reject,
        generator,
        iterator: (contextProvider) =>
          _i || (_i = newNode.generator(contextProvider)),
      }
      pools.addJob(newNode)
    })
    work()
    return p
  }

  return { run, clear }
}

export type Run = ReturnType<typeof createRuntime>['run']
