import * as Effect from "effect/Effect"
import {
  type RenderPhase,
  Renderable,
} from "lib/components/base-components/Renderable"

export class AtomicBoundaryActor extends Renderable {
  readonly events: string[] = []
  writes = 0
  onStart = () => {}
  onHook = () => {}

  constructor() {
    super({})
  }

  doInitialSourceRender() {
    this.writes++
    this.onHook()
  }

  protected override _emitRenderLifecycleEvent(
    phase: RenderPhase,
    boundary: "start" | "end",
  ) {
    this.events.push(`${phase}:${boundary}`)
    if (boundary === "start") this.onStart()
  }
}

export function interruptAtAtomicStart(actor: AtomicBoundaryActor) {
  return Effect.withFiber((fiber) => {
    // A synchronous lifecycle listener can request interruption immediately,
    // like the circuit runtime's AbortSignal observer. It cannot yield an Effect.
    actor.onStart = () => fiber.interruptUnsafe()
    return actor.runRenderPhaseEffect("SourceRender")
  })
}
