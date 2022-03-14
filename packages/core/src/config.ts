import { event } from './event'

export type Config = {
  sliceMs: number
  warnMs: number
}
const MIN_SLICE_MS = 10
const MAX_SLICE_MS = 500
const MIN_WARN_MS = 10
const MAX_WARN_MS = 1000
const DEFAULT_SLICE_MS = 20
const DEFAULT_WARN_MS = 20
export const WARN_VARIANCE = 2
export let _config: Config = {
  sliceMs: DEFAULT_SLICE_MS,
  warnMs: DEFAULT_WARN_MS,
}

const [onConfig, fireConfig] = event<Config>()
export { onConfig }

export const config = (c: Partial<Config>) => {
  const newConfig: Config = { ..._config, ...c }
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

  _config = newConfig
  fireConfig(_config)

  return { ..._config }
}
