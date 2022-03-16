import {
  DEFAULT_SWIMLANE_NAME,
  getPrioritizedLaneNames,
  _globalConfig,
} from './config'
import { fifo, Fifo } from './fifo'
import { watchdog } from './watchdog'

export type PushGeneratorCallback<TResult> = () => Generator<TResult>
export type PushFunctionCallback<TResult> = () => TResult
export type PushCallbackIn<TResult> =
  | PushGeneratorCallback<TResult>
  | PushFunctionCallback<TResult>

export type PushConfig = {
  lane: string | typeof DEFAULT_SWIMLANE_NAME
}

type Node = {
  generator: Function
  iterator?: Generator<any>
  resolve: (res: any) => void
  reject: (error: any) => void
}

type Lane = {
  queue: Fifo<Node>
}
const jobLanes: {
  [laneName: string]: Lane
} = {}

const isGenerator = (
  cb: PushCallbackIn<any>
): cb is PushGeneratorCallback<any> => {
  return cb.prototype?.toString() === '[object Generator]'
}

let isWorking = false

const jobExecutor = function* () {
  while (true) {
    const laneNames = getPrioritizedLaneNames()
    if (laneNames.length === 0) break
    for (let i = 0; i < laneNames.length; i++) {
      const lane = jobLanes[laneNames[i]]
      const nextJob = lane.queue.next()
      if (!nextJob) {
        continue
      }
      if (!nextJob.iterator) {
        nextJob.iterator = nextJob.generator()
      }
      const { iterator, resolve, reject } = nextJob
      const { sliceMs } = _globalConfig
      try {
        const { done, value } = watchdog(
          () => iterator.next(),
          `slice${sliceMs}`,
          sliceMs
        )
        if (done) {
          setImmediate(() => resolve(value))
        }
      } catch (error: any) {
        setImmediate(() => reject(error))
      }
      yield
    }
    yield
  }
}

const _work = () => {
  const { sliceMs } = _globalConfig
  const limit = Date.now() + sliceMs
  const exec = jobExecutor()
  while (Date.now() < limit) {
    const { done } = exec.next()
    if (done) {
      isWorking = false
      break
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
  nibble: PushCallbackIn<TResult>,
  config?: Partial<PushConfig>
): Promise<TResult> => {
  const _config: PushConfig = {
    lane: DEFAULT_SWIMLANE_NAME,
    ...config,
  }

  const { lane: laneName } = _config
  const { lanes } = _globalConfig
  if (!lanes[laneName]) {
    lanes[laneName] = {
      priority: lanes[DEFAULT_SWIMLANE_NAME].priority,
    }
  }
  if (!jobLanes[laneName]) {
    jobLanes[laneName] = {
      queue: fifo<Node>(),
    }
  }

  const lane = jobLanes[laneName]
  const generator: PushGeneratorCallback<TResult> = isGenerator(nibble)
    ? nibble
    : function* () {
        return nibble()
      }
  const p = new Promise<TResult>((resolve, reject) => {
    const newNode: Node = {
      resolve,
      reject,
      generator,
    }
    lane.queue.add(newNode)
  })
  work()
  return p
}
