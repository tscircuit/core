import { subcircuitProps } from "@tscircuit/props"
import type { z } from "zod"
import { inflateCircuitJson } from "../../../../utils/circuit-json/inflate-circuit-json"
import { Net } from "../../Net"
import { Trace } from "../../Trace/Trace"
import { Group } from "../Group"
import type { SubcircuitI } from "./SubcircuitI"
import { Subcircuit_doInitialRenderIsolatedSubcircuits } from "./Subcircuit_doInitialRenderIsolatedSubcircuits"
import { Subcircuit_getSubcircuitPropHash } from "../Subcircuit_getSubcircuitPropHash"

export class Subcircuit
  extends Group<typeof subcircuitProps>
  implements SubcircuitI
{
  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  /**
   * Computes a hash of this subcircuit's props and children for caching.
   * Position/identity props are excluded so identical subcircuits at
   * different locations share the same hash.
   */
  getSubcircuitPropHash(): string {
    return Subcircuit_getSubcircuitPropHash(this)
  }

  /**
   * Render this subcircuit in isolation if _subcircuitCachingEnabled is set.
   * This phase runs before InflateSubcircuitCircuitJson to prepare the
   * isolated circuit JSON that will be inflated.
   */
  doInitialRenderIsolatedSubcircuits(): void {
    Subcircuit_doInitialRenderIsolatedSubcircuits(this)
  }

  doInitialCreateNetsFromProps(): void {
    super.doInitialCreateNetsFromProps()
    this._createTracesForExposedConnections()
  }

  private _createTracesForExposedConnections(): void {
    const exposedNets = this._getNetNamesToExpose()
    if (!exposedNets?.length) return

    const parentSubcircuit = this.parent?.getSubcircuit?.()
    if (!parentSubcircuit) return
    if (!this.name) return

    for (const exposedNetName of exposedNets) {
      const netName = normalizeExposedNetName(exposedNetName)
      const parentNetSelector = `> net.${netName}`
      const childNetSelector = `.${this.name} > net.${netName}`

      const parentNet = parentSubcircuit.children.find(
        (child) => child instanceof Net && child._parsedProps.name === netName,
      )

      if (!parentNet) {
        parentSubcircuit.add(new Net({ name: netName }))
      }

      // Exposed-net helper traces are generated routing intent, not user-named
      // objects. Leave `name` unset so duplicate-name DRC remains about user
      // identity; use from/to to keep this idempotent when the same subcircuit
      // render phase runs more than once.
      const existingTrace = parentSubcircuit.children.find((child) => {
        if (!(child instanceof Trace)) return false
        if (!child._exposesSubcircuitConnection) return false
        const childProps = child._parsedProps as Record<string, unknown>
        return (
          childProps.from === childNetSelector &&
          childProps.to === parentNetSelector
        )
      })
      if (existingTrace) continue

      const trace = new Trace({
        from: childNetSelector,
        to: parentNetSelector,
        displayName: netName,
      })
      trace._exposesSubcircuitConnection = true
      parentSubcircuit.add(trace)
    }
  }

  private _getNetNamesToExpose(): string[] {
    const explicitExposedNets = this._parsedProps.exposedNets ?? []
    if (!this._parsedProps.exposeNets) return explicitExposedNets

    const childNetNames = (this.selectAll("net") as Net[])
      .filter((net) => net instanceof Net && net.getSubcircuit() === this)
      .map((net) => net._parsedProps.name)

    return Array.from(new Set([...explicitExposedNets, ...childNetNames]))
  }

  /**
   * During this phase, we inflate the subcircuit circuit json into class
   * instances
   *
   * When subcircuit's define circuitJson, it's basically the same as having
   * a tree of components. All the data from circuit json has to be converted
   * into props for the tree of components
   *
   * We do this in two phases:
   * - Create the components
   * - Create the groups
   * - Add components to groups in the appropriate hierarchy
   */
  doInitialInflateSubcircuitCircuitJson() {
    const isolatedJson = this._isolatedCircuitJson
    if (isolatedJson) {
      this._isInflatedFromCircuitJson = true
      this._isolatedCircuitJson = null
      inflateCircuitJson(this, isolatedJson, [])
      return
    }

    const { circuitJson, children } = this._parsedProps
    if (circuitJson) {
      this._isInflatedFromCircuitJson = true
    }
    inflateCircuitJson(this, circuitJson, children)
  }
}

const normalizeExposedNetName = (netName: string) =>
  netName.startsWith("net.") ? netName.slice("net.".length) : netName
