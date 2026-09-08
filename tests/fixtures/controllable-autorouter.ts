import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

/** An event-driven router whose lifecycle tests control without routing geometry. */
export class ControllableAutorouter implements GenericLocalAutorouter {
  isRouting = false
  startCount = 0
  stopCount = 0
  onStart?: () => void
  private listeners = new Map<
    AutorouterEvent["type"],
    Array<(event: AutorouterEvent) => void>
  >()

  constructor(public input: SimpleRouteJson) {}

  start(): void {
    this.isRouting = true
    this.startCount++
    this.onStart?.()
  }

  stop(): void {
    this.isRouting = false
    this.stopCount++
  }

  on(
    event: "complete",
    callback: (event: AutorouterCompleteEvent) => void,
  ): void
  on(event: "error", callback: (event: AutorouterErrorEvent) => void): void
  on(
    event: "progress",
    callback: (event: AutorouterProgressEvent) => void,
  ): void
  on(
    event: AutorouterEvent["type"],
    callback:
      | ((event: AutorouterCompleteEvent) => void)
      | ((event: AutorouterErrorEvent) => void)
      | ((event: AutorouterProgressEvent) => void),
  ): void {
    const listeners = this.listeners.get(event) ?? []
    listeners.push(callback as (event: AutorouterEvent) => void)
    this.listeners.set(event, listeners)
  }

  emit(event: AutorouterEvent): void {
    for (const listener of this.listeners.get(event.type) ?? []) listener(event)
  }

  solveSync(): never {
    throw new Error(
      "This fixture only supports controlled asynchronous routing",
    )
  }
}
