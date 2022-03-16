export const fifo = <T>() => {
  type Node = {
    item: T
    next?: Node
  }
  let root: Node
  let tip: Node

  const add = (item: T) => {
    const newNode: Node = {
      item,
    }
    if (tip) {
      tip.next = newNode
    }
    tip = newNode
    if (!root) root = tip
  }

  const next = (): T => {
    if (!root) return undefined
    const ret = root.item
    root = root.next
    if (!root) tip = undefined
    return ret
  }

  return { add, next }
}

// FIXME ts 4.7 https://github.com/microsoft/TypeScript/pull/47607
export type Fifo<T> = { add: (item: T) => void; next: () => T } //ReturnType<(typeof fifo)<T>>
