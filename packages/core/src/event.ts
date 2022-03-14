export type EventUnsubscriber = () => void
export type EventResetter = () => void
export type EventEmitter<TPayload> = (payload: TPayload) => void
export type EventListener<TPayload> = (payload: TPayload) => void
export type EventSubscriber<TPayload extends {}> = (
  cb: EventListener<TPayload>
) => EventUnsubscriber

export const event = <TPayload extends {}>(
  defaultHandler?: EventListener<TPayload>
): [EventSubscriber<TPayload>, EventEmitter<TPayload>, EventResetter] => {
  type Handler = EventListener<TPayload>
  let subId = 0
  const subscribers: { [_: string]: Handler } = {}

  let callbacks: Handler[] = []

  const calcCallbacks = () => {
    callbacks =
      Object.keys(subscribers).length > 0
        ? Object.values(subscribers)
        : defaultHandler
        ? [defaultHandler]
        : []
  }
  calcCallbacks()
  const onEvent = (cb: Handler) => {
    const id = subId++
    subscribers[id.toString()] = cb
    calcCallbacks()
    const unsub = () => {
      delete subscribers[id]
      calcCallbacks()
    }
    return unsub
  }
  const fireEvent = (payload: TPayload) => {
    return callbacks.forEach((cb) => cb(payload))
  }
  const clearEvent = () => {
    Object.keys(subscribers).forEach((k) => delete subscribers[k])
    calcCallbacks()
  }
  return [onEvent, fireEvent, clearEvent]
}
