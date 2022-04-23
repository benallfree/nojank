export const fifo = <T>(): Fifo<T> => {
  type Node = {
    item: T
    next?: Node
  }
  let root: Node | undefined
  let tip: Node | undefined

  const api: Fifo<T> = {
    add: (item) => {
      const newNode: Node = {
        item,
      }
      if (tip) {
        tip.next = newNode
      }
      tip = newNode
      if (!root) root = tip
      console.log('added item', { item, root, tip })
    },
    next: () => {
      console.log('text')
      if (!root) return undefined
      const ret = root.item
      root = root.next
      if (!root) tip = undefined
      return ret
    },
    empty: () => !!root,
  }

  return api
}

// FIXME ts 4.7 https://github.com/microsoft/TypeScript/pull/47607
export type Fifo<T> = {
  add: (item: T) => void
  next: () => T | undefined
  empty: () => boolean
} //ReturnType<(typeof fifo)<T>>
