import * as Effect from "effect/Effect"
import {
  Renderable,
  type RenderPhase,
} from "lib/components/base-components/Renderable"

export type RenderOverrideFamily =
  | "phase"
  | "children"
  | "dirty"
  | "incomplete"
  | "incomplete_phase"

export class RenderOverrideBase extends Renderable {
  readonly calls: string[] = []
  constructor() {
    super({})
  }
  record(family: RenderOverrideFamily, implementation: "sync" | "native") {
    this.calls.push(`${family}:${implementation}`)
  }
}

export class SyncRenderOverride extends RenderOverrideBase {
  override runRenderPhase(phase: RenderPhase) {
    this.record("phase", "sync")
    super.runRenderPhase(phase)
  }
  override runRenderPhaseForChildren(phase: RenderPhase) {
    this.record("children", "sync")
    super.runRenderPhaseForChildren(phase)
  }
  override _markDirty(phase: RenderPhase) {
    this.record("dirty", "sync")
    super._markDirty(phase)
  }
  override _hasIncompleteAsyncEffects() {
    this.record("incomplete", "sync")
    return super._hasIncompleteAsyncEffects()
  }
  override _hasIncompleteAsyncEffectsInSubtreeForPhase(phase: RenderPhase) {
    this.record("incomplete_phase", "sync")
    return super._hasIncompleteAsyncEffectsInSubtreeForPhase(phase)
  }
}

export class NativeRenderOverride extends RenderOverrideBase {
  override runRenderPhaseEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("phase", "native")),
      super.runRenderPhaseEffect(phase),
    )
  }
  override runRenderPhaseForChildrenEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("children", "native")),
      super.runRenderPhaseForChildrenEffect(phase),
    )
  }
  override _markDirtyEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("dirty", "native")),
      super._markDirtyEffect(phase),
    )
  }
  override _hasIncompleteAsyncEffectsEffect() {
    return Effect.andThen(
      Effect.sync(() => this.record("incomplete", "native")),
      super._hasIncompleteAsyncEffectsEffect(),
    )
  }
  override _hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(
    phase: RenderPhase,
  ) {
    return Effect.andThen(
      Effect.sync(() => this.record("incomplete_phase", "native")),
      super._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(phase),
    )
  }
}

// These are actual subclass definitions; no core prototype is modified.
class BothRenderOverrides extends NativeRenderOverride {
  override runRenderPhase(phase: RenderPhase) {
    this.record("phase", "sync")
    super.runRenderPhase(phase)
  }
  override runRenderPhaseEffect(phase: RenderPhase) {
    return RenderOverrideBase.prototype.runRenderPhaseEffect
      .call(this, phase)
      .pipe(Effect.tap(() => Effect.sync(() => this.record("phase", "native"))))
  }
  override runRenderPhaseForChildren(phase: RenderPhase) {
    this.record("children", "sync")
    super.runRenderPhaseForChildren(phase)
  }
  override runRenderPhaseForChildrenEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("children", "native")),
      RenderOverrideBase.prototype.runRenderPhaseForChildrenEffect.call(
        this,
        phase,
      ),
    )
  }
  override _markDirty(phase: RenderPhase) {
    this.record("dirty", "sync")
    super._markDirty(phase)
  }
  override _markDirtyEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("dirty", "native")),
      RenderOverrideBase.prototype._markDirtyEffect.call(this, phase),
    )
  }
  override _hasIncompleteAsyncEffects() {
    this.record("incomplete", "sync")
    return super._hasIncompleteAsyncEffects()
  }
  override _hasIncompleteAsyncEffectsEffect() {
    return Effect.andThen(
      Effect.sync(() => this.record("incomplete", "native")),
      RenderOverrideBase.prototype._hasIncompleteAsyncEffectsEffect.call(this),
    )
  }
  override _hasIncompleteAsyncEffectsInSubtreeForPhase(phase: RenderPhase) {
    this.record("incomplete_phase", "sync")
    return super._hasIncompleteAsyncEffectsInSubtreeForPhase(phase)
  }
  override _hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(
    phase: RenderPhase,
  ) {
    return Effect.andThen(
      Effect.sync(() => this.record("incomplete_phase", "native")),
      RenderOverrideBase.prototype._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect.call(
        this,
        phase,
      ),
    )
  }
}

class SyncNearNativeRenderOverride extends NativeRenderOverride {
  override runRenderPhase(phase: RenderPhase) {
    this.record("phase", "sync")
    super.runRenderPhase(phase)
  }
  override runRenderPhaseForChildren(phase: RenderPhase) {
    this.record("children", "sync")
    super.runRenderPhaseForChildren(phase)
  }
  override _markDirty(phase: RenderPhase) {
    this.record("dirty", "sync")
    super._markDirty(phase)
  }
  override _hasIncompleteAsyncEffects() {
    this.record("incomplete", "sync")
    return super._hasIncompleteAsyncEffects()
  }
  override _hasIncompleteAsyncEffectsInSubtreeForPhase(phase: RenderPhase) {
    this.record("incomplete_phase", "sync")
    return super._hasIncompleteAsyncEffectsInSubtreeForPhase(phase)
  }
}

class NativeNearSyncRenderOverride extends SyncRenderOverride {
  override runRenderPhaseEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("phase", "native")),
      super.runRenderPhaseEffect(phase),
    )
  }
  override runRenderPhaseForChildrenEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("children", "native")),
      super.runRenderPhaseForChildrenEffect(phase),
    )
  }
  override _markDirtyEffect(phase: RenderPhase) {
    return Effect.andThen(
      Effect.sync(() => this.record("dirty", "native")),
      super._markDirtyEffect(phase),
    )
  }
  override _hasIncompleteAsyncEffectsEffect() {
    return Effect.andThen(
      Effect.sync(() => this.record("incomplete", "native")),
      super._hasIncompleteAsyncEffectsEffect(),
    )
  }
  override _hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(
    phase: RenderPhase,
  ) {
    return Effect.andThen(
      Effect.sync(() => this.record("incomplete_phase", "native")),
      super._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(phase),
    )
  }
}

function withOwnSyncMethods() {
  return Object.assign(new NativeRenderOverride(), {
    runRenderPhase(this: RenderOverrideBase, phase: RenderPhase) {
      this.record("phase", "sync")
      RenderOverrideBase.prototype.runRenderPhase.call(this, phase)
    },
    runRenderPhaseForChildren(this: RenderOverrideBase, phase: RenderPhase) {
      this.record("children", "sync")
      RenderOverrideBase.prototype.runRenderPhaseForChildren.call(this, phase)
    },
    _markDirty(this: RenderOverrideBase, phase: RenderPhase) {
      this.record("dirty", "sync")
      RenderOverrideBase.prototype._markDirty.call(this, phase)
    },
    _hasIncompleteAsyncEffects(this: RenderOverrideBase) {
      this.record("incomplete", "sync")
      return RenderOverrideBase.prototype._hasIncompleteAsyncEffects.call(this)
    },
    _hasIncompleteAsyncEffectsInSubtreeForPhase(
      this: RenderOverrideBase,
      phase: RenderPhase,
    ) {
      this.record("incomplete_phase", "sync")
      return RenderOverrideBase.prototype._hasIncompleteAsyncEffectsInSubtreeForPhase.call(
        this,
        phase,
      )
    },
  })
}

function withOwnNativeMethods() {
  const actor = new SyncRenderOverride()
  return Object.assign(actor, {
    runRenderPhaseEffect(phase: RenderPhase) {
      return Effect.andThen(
        Effect.sync(() => actor.record("phase", "native")),
        RenderOverrideBase.prototype.runRenderPhaseEffect.call(actor, phase),
      )
    },
    runRenderPhaseForChildrenEffect(phase: RenderPhase) {
      return Effect.andThen(
        Effect.sync(() => actor.record("children", "native")),
        RenderOverrideBase.prototype.runRenderPhaseForChildrenEffect.call(
          actor,
          phase,
        ),
      )
    },
    _markDirtyEffect(phase: RenderPhase) {
      return Effect.andThen(
        Effect.sync(() => actor.record("dirty", "native")),
        RenderOverrideBase.prototype._markDirtyEffect.call(actor, phase),
      )
    },
    _hasIncompleteAsyncEffectsEffect() {
      return Effect.andThen(
        Effect.sync(() => actor.record("incomplete", "native")),
        RenderOverrideBase.prototype._hasIncompleteAsyncEffectsEffect.call(
          actor,
        ),
      )
    },
    _hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(phase: RenderPhase) {
      return Effect.andThen(
        Effect.sync(() => actor.record("incomplete_phase", "native")),
        RenderOverrideBase.prototype._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect.call(
          actor,
          phase,
        ),
      )
    },
  })
}

export const renderOverrideCases = [
  {
    name: "base",
    create: () => new RenderOverrideBase(),
    nearest: [],
    identity: [],
  },
  {
    name: "sync",
    create: () => new SyncRenderOverride(),
    nearest: ["sync"],
    identity: ["sync"],
  },
  {
    name: "native",
    create: () => new NativeRenderOverride(),
    nearest: ["native"],
    identity: ["native"],
  },
  {
    name: "same_owner",
    create: () => new BothRenderOverrides(),
    nearest: ["native"],
    identity: ["sync", "native"],
  },
  {
    name: "sync_near",
    create: () => new SyncNearNativeRenderOverride(),
    nearest: ["sync", "native"],
    identity: ["sync", "native"],
  },
  {
    name: "native_near",
    create: () => new NativeNearSyncRenderOverride(),
    nearest: ["native"],
    identity: ["sync", "native"],
  },
  {
    name: "own_sync",
    create: withOwnSyncMethods,
    nearest: ["sync", "native"],
    identity: ["sync", "native"],
  },
  {
    name: "own_native",
    create: withOwnNativeMethods,
    nearest: ["native"],
    identity: ["sync", "native"],
  },
] as const

export function attachRenderOverride(parent: Renderable, child: Renderable) {
  parent.children.push(child)
  child.parent = parent
}
