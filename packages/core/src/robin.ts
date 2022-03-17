export type Robin<T> = {
  add: (item: T) => void
  next: (search?: (e: T) => boolean) => T | undefined
  remove: (item: T) => void
}

export const robin = <T>(): Robin<T> => {
  let idx = -1
  let queue: T[] = []

  const api: Robin<T> = {
    add: (item) => {
      queue.push(item)
      if (idx === -1) idx = 0
    },
    next: (search) => {
      if (queue.length === 0) return undefined
      if (search) {
        let tIdx = idx
        do {
          const e = queue[tIdx]
          if (typeof e === 'undefined')
            throw new Error(`Search past end of queue`)
          if (search(e)) {
            idx = tIdx
            return queue[tIdx]
          }
          tIdx++
          if (tIdx >= queue.length) tIdx = 0
        } while (tIdx != idx)
        return undefined
      }
      idx++
      if (idx >= queue.length) idx = 0
      return queue[idx]
    },
    remove: (item) => {
      queue = queue.filter((e) => e !== item)
    },
  }

  return api
}
