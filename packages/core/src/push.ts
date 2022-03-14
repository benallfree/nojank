import { _config } from './config'
import { watchdog } from './watchdog'

export type PushGeneratorCallback<TResult> = () => Generator<TResult>
export type PushFunctionCallback<TResult> = () => TResult
export type PushCallbackIn<TResult> =
  | PushGeneratorCallback<TResult>
  | PushFunctionCallback<TResult>
export type Push = <TResult>(cb: PushCallbackIn<TResult>) => Promise<TResult>

export const { push } = (() => {
  const { sliceMs } = _config
  type Job = () => void
  type Node = {
    nibble: Generator<any>
    resolve: (res: any) => void
    reject: (error: any) => void
    next?: Node
  }
  let root: Node | undefined
  let tip: Node | undefined
  let isWorking = false
  const isGenerator = (
    cb: PushCallbackIn<any>
  ): cb is PushGeneratorCallback<any> => {
    return cb.prototype?.toString() === '[object Generator]'
  }
  const work = () => {
    if (isWorking) return
    if (!root) return
    isWorking = true
    const _work = () => {
      const limit = Date.now() + sliceMs
      while (Date.now() < limit) {
        if (!root) break
        const { nibble, reject, resolve } = root
        try {
          const { done, value } = watchdog(
            () => nibble.next(),
            `slice${sliceMs}`,
            sliceMs
          )
          if (done) {
            setImmediate(() => resolve(value))
            root = root?.next
            if (!root?.next) tip = undefined
          }
        } catch (error: any) {
          setImmediate(() => reject(error))
          break
        }
      }
      isWorking = !!root
      if (isWorking) {
        setImmediate(_work)
      }
    }
    setImmediate(_work)
  }

  const push = <TResult>(nibble: PushCallbackIn<TResult>): Promise<TResult> => {
    const _nibble: PushGeneratorCallback<TResult> = isGenerator(nibble)
      ? nibble
      : function* () {
          return nibble()
        }
    const p = new Promise<TResult>((resolve, reject) => {
      const newNode: Node = {
        resolve,
        reject,
        nibble: _nibble(),
      }
      if (tip) {
        tip.next = newNode
      }
      tip = newNode
      if (!root) root = newNode
    })
    work()
    return p
  }

  return { push }
})()
