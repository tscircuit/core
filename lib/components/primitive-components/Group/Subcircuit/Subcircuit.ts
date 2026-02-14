import { subcircuitProps } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { IsolatedCircuit as IsolatedCircuitType } from "index"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
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
  _subcircuitCacheKey: string | null = null
  /** The isolated circuit being rendered (null when not in progress or complete) */
  private _pendingIsolatedCircuit: IsolatedCircuit | null = null

  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  /**
   * Initial render for IsolatedSubcircuitRender phase.
   * If caching is enabled, renders children in an isolated circuit and caches the result.
   */
  doInitialIsolatedSubcircuitRender() {
    if (!this._parsedProps._subcircuitCachingEnabled) return
    if (this._isInflatedFromCircuitJson) return
    if (this.root === null) return
    // Don't cache-render if we're already inside an IsolatedCircuit
    // (nested cached subcircuits should render normally within their parent's isolated circuit)
    if (!this.root.isRootCircuit) return
    // Don't cache-render if an ancestor subcircuit will do cache rendering
    // (the ancestor will move us into its isolated circuit)
    if (this._hasAncestorWithCaching()) return

    // Compute cache key from children structure
    this._subcircuitCacheKey = getSubcircuitCacheKey(this)

    // Check cache first
    const cached = this.root._cachedSubcircuitCircuitJson.get(
      this._subcircuitCacheKey,
    )
    if (cached) {
      this._isolatedCircuitJson = cached
      this._clearChildren()
      return
    }

    // Create isolated circuit with children
    const isolatedCircuit = new IsolatedCircuit({
      platform: {
        ...this.root.platform,
        pcbDisabled: this.root.pcbDisabled,
        schematicDisabled: this.root.schematicDisabled,
      },
    })

    for (const child of this.children) {
      isolatedCircuit.add(child)
    }
    this._clearChildren()

    // Store for continued rendering in update phase
    this._pendingIsolatedCircuit = isolatedCircuit

    // First synchronous render pass
    isolatedCircuit.render()

    // Check if already complete (no async effects)
    if (!isolatedCircuit._hasIncompleteAsyncEffects()) {
      this._completeIsolatedRender()
    } else {
      // Mark dirty so updateIsolatedSubcircuitRender gets called on next render cycle
      this.renderPhaseStates.IsolatedSubcircuitRender.dirty = true
    }
  }

  /**
   * Update phase for IsolatedSubcircuitRender - continues pumping the isolated
   * circuit render until all async effects complete.
   */
  updateIsolatedSubcircuitRender() {
    if (!this._pendingIsolatedCircuit) return

    // Continue rendering the isolated circuit
    this._pendingIsolatedCircuit.render()

    // Check if complete
    if (!this._pendingIsolatedCircuit._hasIncompleteAsyncEffects()) {
      this._completeIsolatedRender()
      // Mark InflateSubcircuitCircuitJson dirty so it gets processed
      this.renderPhaseStates.InflateSubcircuitCircuitJson.dirty = true
    } else {
      // Keep marking dirty so we get called again
      this.renderPhaseStates.IsolatedSubcircuitRender.dirty = true
    }
  }

  /**
   * Complete the isolated render by caching the result and clearing the pending circuit.
   */
  private _completeIsolatedRender() {
    if (!this._pendingIsolatedCircuit) return

    // Extract and cache the result
    this._isolatedCircuitJson = this._pendingIsolatedCircuit.getCircuitJson()
    this.root!._cachedSubcircuitCircuitJson.set(
      this._subcircuitCacheKey!,
      this._isolatedCircuitJson,
    )
    this._pendingIsolatedCircuit = null
  }

  private _clearChildren() {
    this.children = []
    this._normalComponentNameMap = null
  }

  /**
   * Check if any ancestor subcircuit has caching enabled.
   * If so, that ancestor will handle isolated rendering for this subtree.
   */
  private _hasAncestorWithCaching(): boolean {
    let current = this.parent
    while (current) {
      if (
        current instanceof Subcircuit &&
        current._parsedProps._subcircuitCachingEnabled
      ) {
        return true
      }
      current = current.parent
    }
    return false
  }

  /**
   * Inflate isolated circuit JSON or circuitJson prop into component instances.
   */
  doInitialInflateSubcircuitCircuitJson() {
    // Wait for isolated render to complete before inflating
    if (this._pendingIsolatedCircuit) {
      // Mark dirty so we retry on next render cycle
      this.renderPhaseStates.InflateSubcircuitCircuitJson.dirty = true
      return
    }

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

  /**
   * Update phase for InflateSubcircuitCircuitJson - handles inflation after
   * isolated render completes.
   */
  updateInflateSubcircuitCircuitJson() {
    // Still waiting for isolated render
    if (this._pendingIsolatedCircuit) {
      this.renderPhaseStates.InflateSubcircuitCircuitJson.dirty = true
      return
    }

    // If isolated render just completed, we need to inflate now
    if (this._isolatedCircuitJson && !this._isInflatedFromCircuitJson) {
      this._isInflatedFromCircuitJson = true
      inflateCircuitJson(this, this._isolatedCircuitJson, [])
      this._isolatedCircuitJson = null
    }
  }

  /**
   * Override to include pending isolated circuit in async effect tracking.
   * This ensures the parent circuit's renderUntilSettled() waits for the
   * isolated subcircuit render to complete.
   */
  override _hasIncompleteAsyncEffects(): boolean {
    // Check if we have a pending isolated render with incomplete effects
    if (this._pendingIsolatedCircuit?._hasIncompleteAsyncEffects()) {
      return true
    }

    // Call parent implementation for other async effects
    return super._hasIncompleteAsyncEffects()
  }
}
