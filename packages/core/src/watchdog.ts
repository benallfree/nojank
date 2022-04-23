import { event, EventSubscriber } from './event'

export const WARN_VARIANCE = 2

export type UnixMilliseconds = number

export type OnJankPayload = { ms: UnixMilliseconds; watchId: string }
export type JankHandler = Parameters<EventSubscriber<OnJankPayload>>[0]

export type WatchdogProvider = {
  warnMs: () => UnixMilliseconds
}
export const createWatchdogService = (watchdogProvider: WatchdogProvider) => {
  let isRunning = false
  let tid: ReturnType<typeof setTimeout>
  const { warnMs } = watchdogProvider

  const _startRootWatchdog = () => {
    isRunning = true
    const start = Date.now()
    const limit = start + warnMs() + WARN_VARIANCE
    tid = setTimeout(() => {
      const now = Date.now()
      if (now > limit) {
        fireJank({ ms: now - start, watchId: 'unknown' })
      }
      if (isRunning) _startRootWatchdog()
    }, warnMs())
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
    _startRootWatchdog()
  }

  const restart = () => {
    const wasRunning = pause()
    if (wasRunning) start()
  }

  const [onJank, fireJank, clearOnJank] = event<OnJankPayload>(
    ({ ms, watchId }) =>
      console.warn(
        `${ms}ms jank detected in ${watchId} code. Check your synchronous code now.`
      )
  )

  const isolate = <T>(block: () => T, watchId: string, ms?: number): T => {
    const _start = Date.now()
    const _ms = ms || warnMs()
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

  const api = {
    stop,
    start,
    pause,
    restart,
    onJank,
    isolate,
  }
  return api
}

export type WatchdogService = ReturnType<typeof createWatchdogService>
