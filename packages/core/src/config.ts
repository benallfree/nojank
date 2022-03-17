import { forEach, merge } from '@s-libs/micro-dash'
import { PartialDeep } from 'type-fest'
import { event } from './event'
import { pools } from './init'

type LaneConfig = {
  priority: number
}

const MIN_SLICE_MS = 10
const MAX_SLICE_MS = 500
const MIN_WARN_MS = 10
const MAX_WARN_MS = 1000
export const DEFAULT_SLICE_MS = 20
export const DEFAULT_WARN_MS = 20
export const WARN_VARIANCE = 2
export const DEFAULT_LANE_PRIORITY = 10
export const LANE_MIN_PRIORITY = 0
export const LANE_MAX_PRIORITY = 10000

export const DEFAULT_SWIMLANE_NAME = '__default__'

export type Config = {
  sliceMs: number
  warnMs: number
  lanes: {
    [DEFAULT_SWIMLANE_NAME]: LaneConfig
    [laneName: string]: LaneConfig
  }
}

export const DEFAULT_CONFIG: Config = {
  sliceMs: DEFAULT_SLICE_MS,
  warnMs: DEFAULT_WARN_MS,
  lanes: {
    [DEFAULT_SWIMLANE_NAME]: {
      priority: DEFAULT_LANE_PRIORITY,
    },
  },
}

export let _globalConfig = { ...DEFAULT_CONFIG }

const [onConfig, fireConfig] = event<Config>()
export { onConfig }

export const config = (c: PartialDeep<Config>, reset = false) => {
  const newConfig: Config = merge(
    {},
    DEFAULT_CONFIG,
    reset ? {} : _globalConfig,
    c
  )
  const { sliceMs, warnMs } = newConfig
  if (sliceMs < MIN_SLICE_MS || sliceMs > MAX_SLICE_MS) {
    throw new Error(
      `sliceMs ${sliceMs} must be between ${MIN_SLICE_MS} and ${MAX_SLICE_MS}`
    )
  }
  if (warnMs < MIN_WARN_MS || warnMs > MAX_WARN_MS) {
    throw new Error(
      `warnMs ${warnMs} must be between ${MIN_WARN_MS} and ${MAX_WARN_MS}`
    )
  }
  forEach(newConfig.lanes, (lane, laneName) => {
    if (
      lane.priority < LANE_MIN_PRIORITY ||
      lane.priority > LANE_MAX_PRIORITY
    ) {
      throw new Error(
        `Priority for lane ${laneName} must be between ${LANE_MIN_PRIORITY} and ${LANE_MAX_PRIORITY}`
      )
    }
    pools.ensureLane({ ...lane, name: laneName })
  })

  _globalConfig = newConfig
  fireConfig(_globalConfig)

  return { ..._globalConfig }
}

export const getPrioritizedLaneNames = () => {
  const { lanes } = _globalConfig
  const _defaultPriority =
    lanes[DEFAULT_SWIMLANE_NAME].priority || DEFAULT_LANE_PRIORITY
  const laneNames = Object.getOwnPropertyNames(lanes).sort(
    (a, b) =>
      (lanes[b]?.priority || _defaultPriority) -
      (lanes[a]?.priority || _defaultPriority)
  )
  return laneNames
}
