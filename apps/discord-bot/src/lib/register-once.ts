import type { Client, ClientEvents } from "discord.js"

type EventKey = keyof ClientEvents

const handlers = new WeakMap<Client, Map<EventKey, Map<symbol, (...args: never[]) => void>>>()

export function registerOnce<K extends EventKey>(
  client: Client,
  event: K,
  key: symbol,
  listener: (...args: ClientEvents[K]) => void | Promise<void>
) {
  let clientMap = handlers.get(client)
  if (!clientMap) {
    clientMap = new Map()
    handlers.set(client, clientMap)
  }

  let eventMap = clientMap.get(event)
  if (!eventMap) {
    eventMap = new Map()
    clientMap.set(event, eventMap)
  }

  const prev = eventMap.get(key)
  if (prev) {
    client.off(event, prev as (...args: ClientEvents[K]) => void)
  }

  const wrapped = (...args: ClientEvents[K]) => listener(...args)
  eventMap.set(key, wrapped as (...args: never[]) => void)
  client.on(event, wrapped as (...args: ClientEvents[K]) => void)
}
