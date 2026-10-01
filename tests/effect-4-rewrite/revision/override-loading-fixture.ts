import type { PartsEngine } from "@tscircuit/props"
import * as Effect from "effect/Effect"
import { Resistor } from "lib/components/normal-components/Resistor"
import type { ReactElement } from "react"

type SupplierQuery = Parameters<Resistor["_getSupplierPartNumbersEffect"]>[0]
type SourceComponent = Parameters<PartsEngine["findPart"]>[0]["sourceComponent"]

export class LoadingOverrideBase extends Resistor {
  readonly calls: string[] = []
  constructor() { super({ name: "R1", resistance: "1k" }) }
  querySupplier(partsEngine: PartsEngine, sourceComponent: SourceComponent) {
    return this._getSupplierPartNumbersEffect({ partsEngine, sourceComponent })
  }
  callBaseSupplier(partsEngine: PartsEngine, sourceComponent: SourceComponent, footprinterString: string | undefined) {
    return super._getSupplierPartNumbers(partsEngine, sourceComponent, footprinterString)
  }
  callBaseSupplierEffect(query: SupplierQuery) {
    return super._getSupplierPartNumbersEffect(query)
  }
}
class SyncLoading extends LoadingOverrideBase {
  protected override _getSupplierPartNumbers(
    partsEngine: PartsEngine, sourceComponent: SourceComponent, footprinterString: string | undefined,
  ) {
    this.calls.push("supplier:sync")
    return super._getSupplierPartNumbers(partsEngine, sourceComponent, footprinterString)
  }
  override _renderReactSubtree(element: ReactElement) {
    this.calls.push("react:sync")
    return super._renderReactSubtree(element)
  }
}
class NativeLoading extends LoadingOverrideBase {
  protected override _getSupplierPartNumbersEffect(query: SupplierQuery) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("supplier:native") }), super._getSupplierPartNumbersEffect(query))
  }
  override _renderReactSubtreeEffect(element: ReactElement) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("react:native") }), super._renderReactSubtreeEffect(element))
  }
}
class BothLoading extends LoadingOverrideBase {
  protected override _getSupplierPartNumbers(
    partsEngine: PartsEngine, sourceComponent: SourceComponent, footprinterString: string | undefined,
  ) {
    this.calls.push("supplier:sync")
    return super._getSupplierPartNumbers(partsEngine, sourceComponent, footprinterString)
  }
  protected override _getSupplierPartNumbersEffect(query: SupplierQuery) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("supplier:native") }), super._getSupplierPartNumbersEffect(query))
  }
  override _renderReactSubtree(element: ReactElement) {
    this.calls.push("react:sync")
    return super._renderReactSubtree(element)
  }
  override _renderReactSubtreeEffect(element: ReactElement) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("react:native") }), super._renderReactSubtreeEffect(element))
  }
}
class SyncNearLoading extends NativeLoading {
  protected override _getSupplierPartNumbers(
    partsEngine: PartsEngine, sourceComponent: SourceComponent, footprinterString: string | undefined,
  ) {
    this.calls.push("supplier:sync")
    return super._getSupplierPartNumbers(partsEngine, sourceComponent, footprinterString)
  }
  override _renderReactSubtree(element: ReactElement) {
    this.calls.push("react:sync")
    return super._renderReactSubtree(element)
  }
}
class NativeNearLoading extends SyncLoading {
  protected override _getSupplierPartNumbersEffect(query: SupplierQuery) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("supplier:native") }), super._getSupplierPartNumbersEffect(query))
  }
  override _renderReactSubtreeEffect(element: ReactElement) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("react:native") }), super._renderReactSubtreeEffect(element))
  }
}
function ownSync() {
  const actor = new NativeLoading()
  Object.defineProperty(actor, "_getSupplierPartNumbers", { value: function (partsEngine: PartsEngine, sourceComponent: SourceComponent, footprinterString: string | undefined) {
    actor.calls.push("supplier:sync")
    return actor.callBaseSupplier(partsEngine, sourceComponent, footprinterString)
  } })
  actor._renderReactSubtree = (element) => {
    actor.calls.push("react:sync")
    return LoadingOverrideBase.prototype._renderReactSubtree.call(actor, element)
  }
  return actor
}
function ownNative() {
  const actor = new SyncLoading()
  Object.defineProperty(actor, "_getSupplierPartNumbersEffect", { value: (query: SupplierQuery) => Effect.andThen(
    Effect.sync(() => { actor.calls.push("supplier:native") }),
    actor.callBaseSupplierEffect(query),
  ) })
  actor._renderReactSubtreeEffect = (element) => Effect.andThen(
    Effect.sync(() => { actor.calls.push("react:native") }),
    LoadingOverrideBase.prototype._renderReactSubtreeEffect.call(actor, element),
  )
  return actor
}
export const loadingOverrideCases = [
  { name: "base", create: () => new LoadingOverrideBase(), supplier: [], react: [] },
  { name: "sync", create: () => new SyncLoading(), supplier: ["sync"], react: ["sync"] },
  { name: "native", create: () => new NativeLoading(), supplier: ["native"], react: ["native"] },
  { name: "same_owner", create: () => new BothLoading(), supplier: ["native", "sync"], react: ["sync", "native"] },
  { name: "sync_near", create: () => new SyncNearLoading(), supplier: ["native", "sync"], react: ["sync", "native"] },
  { name: "native_near", create: () => new NativeNearLoading(), supplier: ["native", "sync"], react: ["sync", "native"] },
  { name: "own_sync", create: ownSync, supplier: ["native", "sync"], react: ["sync", "native"] },
  { name: "own_native", create: ownNative, supplier: ["native", "sync"], react: ["sync", "native"] },
] as const
