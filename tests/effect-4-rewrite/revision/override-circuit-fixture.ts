import * as Effect from "effect/Effect"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { type RenderPhase } from "lib/components/base-components/Renderable"
import { z } from "zod"

export class CycleBase extends PrimitiveComponent {
  readonly calls: string[] = []
  get config() { return { componentName: "RevisionCycle", zodProps: z.object({}).passthrough() } }
  override get isGroup() { return true }
  override runRenderPhase(_phase: RenderPhase) {}
  override runRenderPhaseForChildren(_phase: RenderPhase) {}
}
class SyncCycle extends CycleBase {
  override runRenderCycle() { this.calls.push("sync"); super.runRenderCycle() }
}
class NativeCycle extends CycleBase {
  override runRenderCycleEffect() {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.runRenderCycleEffect())
  }
}
class BothCycle extends CycleBase {
  override runRenderCycle() { this.calls.push("sync"); super.runRenderCycle() }
  override runRenderCycleEffect() {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.runRenderCycleEffect())
  }
}
class SyncNearCycle extends NativeCycle {
  override runRenderCycle() { this.calls.push("sync"); super.runRenderCycle() }
}
class NativeNearCycle extends SyncCycle {
  override runRenderCycleEffect() {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.runRenderCycleEffect())
  }
}

export class CircuitRenderBase extends IsolatedCircuit {
  readonly calls: string[] = []
  constructor() { super(); this.add(new CycleBase({})) }
}
class SyncCircuitRender extends CircuitRenderBase {
  override render() { this.calls.push("sync"); super.render() }
}
class NativeCircuitRender extends CircuitRenderBase {
  override renderEffect() {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.renderEffect())
  }
}
class BothCircuitRender extends CircuitRenderBase {
  override render() { this.calls.push("sync"); super.render() }
  override renderEffect() {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.renderEffect())
  }
}
class SyncNearCircuitRender extends NativeCircuitRender {
  override render() { this.calls.push("sync"); super.render() }
}
class NativeNearCircuitRender extends SyncCircuitRender {
  override renderEffect() {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.renderEffect())
  }
}

export const cycleOverrideCases = [
  { name: "base", create: () => new CycleBase({}), calls: [] },
  { name: "sync", create: () => new SyncCycle({}), calls: ["sync"] },
  { name: "native", create: () => new NativeCycle({}), calls: ["native"] },
  { name: "same_owner", create: () => new BothCycle({}), calls: ["sync", "native"] },
  { name: "sync_near", create: () => new SyncNearCycle({}), calls: ["sync", "native"] },
  { name: "native_near", create: () => new NativeNearCycle({}), calls: ["sync", "native"] },
  { name: "own_sync", create: () => {
    const actor = new NativeCycle({})
    actor.runRenderCycle = () => { actor.calls.push("sync"); CycleBase.prototype.runRenderCycle.call(actor) }
    return actor
  }, calls: ["sync", "native"] },
  { name: "own_native", create: () => {
    const actor = new SyncCycle({})
    actor.runRenderCycleEffect = () => Effect.andThen(
      Effect.sync(() => { actor.calls.push("native") }), CycleBase.prototype.runRenderCycleEffect.call(actor),
    )
    return actor
  }, calls: ["sync", "native"] },
] as const

export const circuitRenderOverrideCases = [
  { name: "base", create: () => new CircuitRenderBase(), calls: [] },
  { name: "sync", create: () => new SyncCircuitRender(), calls: ["sync"] },
  { name: "native", create: () => new NativeCircuitRender(), calls: ["native"] },
  { name: "same_owner", create: () => new BothCircuitRender(), calls: ["sync", "native"] },
  { name: "sync_near", create: () => new SyncNearCircuitRender(), calls: ["sync", "native"] },
  { name: "native_near", create: () => new NativeNearCircuitRender(), calls: ["sync", "native"] },
  { name: "own_sync", create: () => {
    const actor = new NativeCircuitRender()
    actor.render = () => { actor.calls.push("sync"); CircuitRenderBase.prototype.render.call(actor) }
    return actor
  }, calls: ["sync", "native"] },
  { name: "own_native", create: () => {
    const actor = new SyncCircuitRender()
    actor.renderEffect = () => Effect.andThen(
      Effect.sync(() => { actor.calls.push("native") }), CircuitRenderBase.prototype.renderEffect.call(actor),
    )
    return actor
  }, calls: ["sync", "native"] },
] as const
