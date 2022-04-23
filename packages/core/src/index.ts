export const MIN_SLICE_MS = 10
export const MAX_SLICE_MS = 500
export const MIN_WARN_MS = 10
export const MAX_WARN_MS = 1000
export const DEFAULT_SLICE_MS = 20
export const DEFAULT_WARN_MS = 20
export const DEFAULT_LANE_PRIORITY = 10
export const LANE_MIN_PRIORITY = 0
export const LANE_MAX_PRIORITY = 10000
import { merge } from '@s-libs/micro-dash'
import { PartialDeep } from 'type-fest'
import { createRuntime, Run } from './runtime'
import { validateConfig } from './validateConfig'
import { createWatchdogService, WatchdogService } from './watchdog'
export { OnJankPayload } from './watchdog'

export const DEFAULT_SWIMLANE_NAME = '__default__'

export type NojankApi = {
  run: Run
  watchdog: WatchdogService
  reset: () => void
}

type LaneConfig = {
  priority: number
}

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

let _nojank: NojankApi
export const nojank = (config?: PartialDeep<Config>): NojankApi => {
  if (_nojank) {
    if (config) {
      throw new Error(
        `Attempt to call nojank initializer twice with config. nojank() should only be called once with a config per process.`
      )
    }
    return _nojank
  }

  const _config: Config = merge({}, DEFAULT_CONFIG, config || {})
  validateConfig(_config)

  const watchdogService = createWatchdogService({
    warnMs: () => _config.warnMs,
  })

  const { run, clear } = createRuntime({
    sliceMs: () => _config.sliceMs,
    getPoolIdByLaneName: (name) =>
      _config.lanes[name]?.priority ||
      _config.lanes[DEFAULT_SWIMLANE_NAME].priority,
    watchdog: watchdogService,
  })

  const reset = () => {
    watchdogService.stop()
    clear()
  }

  _nojank = {
    run,
    watchdog: watchdogService,
    reset,
  }

  return _nojank
}
