import { subcircuitProps } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { IsolatedCircuit, RenderPhase } from "index"
import { IsolatedCircuit as IsolatedCircuitClass } from "lib/IsolatedCircuit"
import {
  orderedRenderPhases,
  renderPhaseIndexMap,
} from "lib/components/base-components/Renderable"
import { inflateCircuitJson } from "lib/utils/circuit-json/inflate-circuit-json"
import type { z } from "zod"
import { Group } from "../Group"
import type { SubcircuitI } from "./SubcircuitI"
import { getSubcircuitCacheKey } from "./Subcircuit_getSubcircuitCacheKey"

/**
 * A Subcircuit is a Group that can optionally be rendered in isolation and
 * cached. When `_subcircuitCachingEnabled` is set, identical subcircuits
 * (same internal structure, different positions) share a single render.
 */
export class Subcircuit
  extends Group<typeof subcircuitProps>
  implements SubcircuitI
{
  _isolatedCircuitJson: AnyCircuitElement[] | null = null
  _isolatedCircuit: IsolatedCircuit | null = null
  _subcircuitCacheKey: string | null = null

  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  /**
   * For isolated subcircuits with caching enabled, intercept the first render
   * phase to perform isolated rendering before children are processed normally.
   */
  override runRenderPhaseForChildren(phase: RenderPhase): void {
    if (this._shouldDoIsolatedRender(phase)) {
      if (!this._continueIsolatedRender()) return
    }
    super.runRenderPhaseForChildren(phase)
  }

  private _shouldDoIsolatedRender(phase: RenderPhase): boolean {
    return (
      phase === "ReactSubtreesRender" &&
      Boolean(this._parsedProps._subcircuitCachingEnabled) &&
      this.root !== null &&
      !this._isInflatedFromCircuitJson
    )
  }

  /**
   * Continues or starts the isolated render. Returns true when complete.
   */
  private _continueIsolatedRender(): boolean {
    // Already have result from cache or previous render - done
    if (this._isolatedCircuitJson) return true

    // First call - check cache or start isolated render
    if (!this._isolatedCircuit) {
      this._subcircuitCacheKey = getSubcircuitCacheKey(this)

      const cached = this.root!._cachedSubcircuitCircuitJson.get(
        this._subcircuitCacheKey,
      )
      if (cached) {
        this._isolatedCircuitJson = cached
        this._clearChildren()
        return true
      }

      this._isolatedCircuit = this._createIsolatedCircuit()
    }

    // Continue rendering isolated circuit
    this._isolatedCircuit.render()

    if (this._isolatedCircuit._hasIncompleteAsyncEffects()) {
      return false // Not settled yet
    }

    // Settled - extract and cache result
    this._isolatedCircuitJson = this._isolatedCircuit.getCircuitJson()
    this.root!._cachedSubcircuitCircuitJson.set(
      this._subcircuitCacheKey!,
      this._isolatedCircuitJson,
    )
    this._clearChildren()
    this._isolatedCircuit = null
    return true
  }

  private _createIsolatedCircuit(): IsolatedCircuit {
    const circuit = new IsolatedCircuitClass({
      platform: {
        ...this.root!.platform,
        pcbDisabled: this.root!.pcbDisabled,
        schematicDisabled: this.root!.schematicDisabled,
      },
    })
    for (const child of this.children) {
      circuit.add(child)
    }
    return circuit
  }

  private _clearChildren() {
    this.children = []
    this._normalComponentNameMap = null
    // Reset phases from InflateSubcircuitCircuitJson onward so the cached JSON
    // gets inflated and all subsequent phases re-run for the new children
    this._resetPhasesFromInflate()
  }

  private _resetPhasesFromInflate() {
    const startIdx = renderPhaseIndexMap.get("InflateSubcircuitCircuitJson")!
    for (let i = startIdx; i < orderedRenderPhases.length; i++) {
      this.renderPhaseStates[orderedRenderPhases[i]].initialized = false
    }
  }

  override _hasIncompleteAsyncEffects(): boolean {
    if (this._isolatedCircuit?._hasIncompleteAsyncEffects()) return true
    return super._hasIncompleteAsyncEffects()
  }

  /**
   * Inflate isolated circuit JSON or circuitJson prop into component instances.
   */
  doInitialInflateSubcircuitCircuitJson() {
    if (this._isolatedCircuitJson) {
      this._isInflatedFromCircuitJson = true
      inflateCircuitJson(this, this._isolatedCircuitJson, [])
      this._isolatedCircuitJson = null
      return
    }

    const { circuitJson, children } = this._parsedProps
    if (circuitJson) {
      this._isInflatedFromCircuitJson = true
    }
    inflateCircuitJson(this, circuitJson, children)
  }
}
