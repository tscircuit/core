import type { GraphicsObject } from "graphics-debug"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

export type AutorouterCompleteEvent = {
  type: "complete"
  traces: SimplifiedPcbTrace[]
  /**
   * Map of obstacle IDs to their connected root connection names.
   * This is used to create source traces for interconnect components
   * that were connected during routing.
   */
  connectedOffboardObstacles?: Record<string, string>
}

export type AutorouterErrorEvent = {
  type: "error"
  error: Error
}

export type AutorouterProgressEvent = {
  type: "progress"
  steps: number
  progress: number
  phase?: string
  iterationsPerSecond?: number
  debugGraphics?: GraphicsObject
}

export type AutorouterEvent =
  | AutorouterCompleteEvent
  | AutorouterErrorEvent
  | AutorouterProgressEvent

export interface GenericLocalAutorouter {
  input: SimpleRouteJson
  isRouting: boolean

  start(): void
  stop(): void

  on(event: "complete", callback: (ev: AutorouterCompleteEvent) => void): void
  on(event: "error", callback: (ev: AutorouterErrorEvent) => void): void
  on(event: "progress", callback: (ev: AutorouterProgressEvent) => void): void

  solveSync(): SimplifiedPcbTrace[]
}
