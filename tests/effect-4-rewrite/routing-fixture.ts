import { Renderable } from "lib/components/base-components/Renderable"
import type { CoreJobContext } from "lib/effect/core-services"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "lib/utils/autorouting/GenericLocalAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

type RouterRegistration =
  | ["complete", (event: AutorouterCompleteEvent) => void]
  | ["error", (event: AutorouterErrorEvent) => void]
  | ["progress", (event: AutorouterProgressEvent) => void]

export const routingInput: SimpleRouteJson = {
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
  layerCount: 2,
  minTraceWidth: 0.15,
  obstacles: [],
  connections: [],
}

export class ControlledAutorouter implements GenericLocalAutorouter {
  readonly input = routingInput
  isRouting = false
  starts = 0
  stops = 0
  listenersRemoved = 0
  completeHandlers: Array<(event: AutorouterCompleteEvent) => void> = []
  errorHandlers: Array<(event: AutorouterErrorEvent) => void> = []
  progressHandlers: Array<(event: AutorouterProgressEvent) => void> = []
  onStart?: () => void

  on(...[event, callback]: RouterRegistration): void {
    if (event === "complete") this.completeHandlers.push(callback)
    else if (event === "error") this.errorHandlers.push(callback)
    else this.progressHandlers.push(callback)
  }

  removeListener(
    event: RouterRegistration[0],
    callback: RouterRegistration[1],
  ): void {
    this.listenersRemoved++
    if (event === "complete")
      this.completeHandlers = this.completeHandlers.filter(
        (handler) => handler !== callback,
      )
    else if (event === "error")
      this.errorHandlers = this.errorHandlers.filter(
        (handler) => handler !== callback,
      )
    else
      this.progressHandlers = this.progressHandlers.filter(
        (handler) => handler !== callback,
      )
  }

  start() {
    this.starts++
    this.isRouting = true
    this.onStart?.()
  }

  stop() {
    this.stops++
    this.isRouting = false
  }

  complete(traces: SimplifiedPcbTrace[] = []) {
    for (const callback of [...this.completeHandlers])
      callback({ type: "complete", traces })
  }

  error(error: Error) {
    for (const callback of [...this.errorHandlers])
      callback({ type: "error", error })
  }

  progress() {
    for (const callback of [...this.progressHandlers])
      callback({ type: "progress", steps: 1, progress: 0.5 })
  }

  solveSync() {
    return []
  }
}

class RoutingOwner extends Renderable {
  constructor() {
    super({})
  }
}

export function createRoutingJob(
  controller = new AbortController(),
): CoreJobContext {
  return {
    owner: new RoutingOwner(),
    signal: controller.signal,
    isCurrent: () => !controller.signal.aborted,
    commit: (write) => (controller.signal.aborted ? undefined : write()),
  }
}
