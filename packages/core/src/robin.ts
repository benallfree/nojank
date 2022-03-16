export const robin = <T>() => {
  let idx = -1
  let queue: T[] = []

  const add = (item: T) => {
    queue.push(item)
    if (idx === -1) idx = 0
  }
  const next = (): T | undefined => {
    if (queue.length === 0) return undefined
    idx++
    if (idx >= queue.length) idx = 0
    return queue[idx]
  }

  return { add, next }
}

export type Robin<T> = { add: (item: T) => void; next: () => T | undefined }
