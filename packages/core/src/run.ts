import { DEFAULT_SWIMLANE_NAME, _globalConfig } from './config'
import { Fifo } from './fifo'
import { pools } from './init'
import { Robin } from './robin'
import { watchdog } from './watchdog'

export type RunGeneratorCallback<TResult> = () => Generator<TResult>
export type RunFunctionCallback<TResult> = () => TResult
export type RunCallbackIn<TResult> =
  | RunGeneratorCallback<TResult>
  | RunFunctionCallback<TResult>

export type RunConfig = {
  lane: string | typeof DEFAULT_SWIMLANE_NAME
}

export type Job = {
  laneName: string
  generator: Function
  iterator: () => Generator<any>
  resolve: (res: any) => void
  reject: (error: any) => void
}

const isGenerator = (
  cb: RunCallbackIn<any>
): cb is RunGeneratorCallback<any> => {
  return cb.prototype?.toString() === '[object Generator]'
}

export type LaneName = string
type PoolId = number
export type Pool = {
  priority: PoolId
  laneNames: Robin<LaneName>
  addLane: (name: keyof Pool['laneNames']) => void
  nextJob: () => Job | undefined
}
export type Lane = {
  name: LaneName
  priority: PoolId
  jobs: Fifo<Job>
  addJob: (job: Job) => void
}

let isWorking = false

const _work = () => {
  const { sliceMs } = _globalConfig
  const limit = Date.now() + sliceMs
  const context = {
    shouldYield: () => Date.now() >= limit,
    expiry: limit,
  }
  while (Date.now() < limit) {
    const job = pools.nextJob()
    if (!job) {
      isWorking = false
      break
    }
    const { iterator, resolve, reject } = job
    try {
      const { done, value } = watchdog(
        () => iterator().next(context),
        `slice${sliceMs}:${name}`,
        limit - Date.now()
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

export const run = <TResult>(
  nibble: RunCallbackIn<TResult>,
  config?: Partial<RunConfig>
): Promise<TResult> => {
  const _config: RunConfig = {
    lane: DEFAULT_SWIMLANE_NAME,
    ...config,
  }

  const generator: RunGeneratorCallback<TResult> = isGenerator(nibble)
    ? nibble
    : function* () {
        return nibble()
      }
  const p = new Promise<TResult>((resolve, reject) => {
    let _i: Generator
    const newNode: Job = {
      laneName: _config.lane,
      resolve,
      reject,
      generator,
      iterator: () => _i || (_i = newNode.generator()),
    }
    pools.addJob(newNode)
  })
  work()
  return p
}
