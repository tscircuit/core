import { CapacityMeshSolver } from "@tscircuit/capacity-autorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "./GenericLocalAutorouter"

export class CapacityMeshAutorouter implements GenericLocalAutorouter {
  input: SimpleRouteJson
  isRouting = false

  constructor(input: SimpleRouteJson) {
    this.input = input
  }
  start(): void {
    throw new Error("Method not implemented.")
  }
  stop(): void {
    throw new Error("Method not implemented.")
  }
  on(event: "complete", callback: (ev: AutorouterCompleteEvent) => void): void
  on(event: "error", callback: (ev: AutorouterErrorEvent) => void): void
  on(event: "progress", callback: (ev: AutorouterProgressEvent) => void): void
  on(event: unknown, callback: unknown): void {
    throw new Error("Method not implemented.")
  }
  solveSync(): SimplifiedPcbTrace[] {
    throw new Error("Method not implemented.")
  }
}
