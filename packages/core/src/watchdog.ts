import { onConfig, WARN_VARIANCE, _globalConfig } from './config'
import { event } from './event'

/**
 * Watchdog
 */

export const { stop, start, pause } = (() => {
  let isRunning = false
  let tid: ReturnType<typeof setTimeout>
  const watchdog = () => {
    const { warnMs } = _globalConfig
    isRunning = true
    const start = Date.now()
    const limit = start + warnMs + WARN_VARIANCE
    tid = setTimeout(() => {
      const now = Date.now()
      if (now > limit) {
        fireJank({ ms: now - start, watchId: 'unknown' })
      }
      if (isRunning) watchdog()
    }, warnMs)
  }

  const stop = () => {
    api.pause()
    clearOnJank()
  }

  const pause = () => {
    const wasRunning = isRunning
    isRunning = false
    clearTimeout(tid)
    return wasRunning
  }

  const start = () => {
    watchdog()
  }

  const restart = () => {
    const wasRunning = pause()
    if (wasRunning) start()
  }

  onConfig(restart)

  const api = {
    stop,
    start,
    pause,
  }
  return api
})()

export type OnJankPayload = { ms: number; watchId: string }
const [onJank, fireJank, clearOnJank] = event<OnJankPayload>(
  ({ ms, watchId }) =>
    console.warn(
      `${ms}ms jank detected in ${watchId} code. Check your synchronous code now.`
    )
)

export const watchdog = (block: () => any, watchId: string, ms?: number) => {
  const { warnMs } = _globalConfig
  const _start = Date.now()
  const _ms = ms || warnMs
  const _limit = _start + _ms + WARN_VARIANCE
  const wasRunning = pause()
  const res = block()
  if (wasRunning) start()
  const now = Date.now()
  if (now > _limit) {
    fireJank({ ms: now - _start, watchId })
  }
  return res
}

export type JankHandler = Parameters<typeof onJank>

export { onJank }
