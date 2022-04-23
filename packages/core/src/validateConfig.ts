import { forEach } from '@s-libs/micro-dash'
import {
  Config,
  LANE_MAX_PRIORITY,
  LANE_MIN_PRIORITY,
  MAX_SLICE_MS,
  MAX_WARN_MS,
  MIN_SLICE_MS,
  MIN_WARN_MS,
} from './index'

export function validateConfig(_config: Config) {
  const { sliceMs, warnMs } = _config
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
  forEach(_config.lanes, (lane, laneName) => {
    if (
      lane.priority < LANE_MIN_PRIORITY ||
      lane.priority > LANE_MAX_PRIORITY
    ) {
      throw new Error(
        `Priority for lane ${laneName} must be between ${LANE_MIN_PRIORITY} and ${LANE_MAX_PRIORITY}`
      )
    }
  })
}
