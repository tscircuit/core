import {
  type RenderPhase,
  Renderable,
} from "lib/components/base-components/Renderable"
import { orderedRenderPhases } from "lib/effect/render-phase-definitions"

export class RenderLedger extends Renderable {
  readonly ledger: string[]
  readonly name: string

  constructor(options: { name: string; ledger: string[] }) {
    super({})
    this.name = options.name
    this.ledger = options.ledger
    for (const phase of orderedRenderPhases) {
      for (const action of ["doInitial", "update", "remove"] as const) {
        Object.defineProperty(this, `${action}${phase}`, {
          configurable: true,
          value: () => this.ledger.push(`${action}:${phase}:${this.name}`),
        })
      }
    }
  }

  protected override _emitRenderLifecycleEvent(
    phase: RenderPhase,
    event: "start" | "end",
  ) {
    this.ledger.push(`${event}:${phase}:${this.name}`)
  }
}

export function attachRenderChild(parent: Renderable, child: Renderable) {
  parent.children.push(child)
  child.parent = parent
}

export async function flushRenderJobs(renderable: Renderable) {
  for (let continuation = 0; continuation < 100; continuation++) {
    if (!renderable._hasIncompleteAsyncEffects()) return
    await Promise.resolve()
  }
  throw new Error("Render jobs did not settle within 100 microtask turns")
}
