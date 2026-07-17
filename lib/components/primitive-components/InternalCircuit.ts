import { internalCircuitProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { RenderPhase } from "../base-components/Renderable"
import type { Port } from "./Port"

const nonPcbPhysicalChildRenderPhases: ReadonlySet<RenderPhase> = new Set([
  // Isolated rendering uses a separate root and would lose this container's
  // physical-phase boundary. Descendants render normally in later phases.
  "RenderIsolatedSubcircuits",
  "FetchPartFootprint",
  "CreateTraceHintsFromProps",
  "CreateAutoplacedBreakoutPoints",
  "PanelBoardLayout",
  "ValidatePcbCoordinates",
  "PanelLayout",
  "SilkscreenOverlapAdjustment",
  "CadModelRender",
  "PartsEngineRender",
  "SupplierFootprintMismatchWarning",
])

export class InternalCircuit extends PrimitiveComponent<
  typeof internalCircuitProps
> {
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "InternalCircuit",
      zodProps: internalCircuitProps,
    }
  }

  override onAddToParent(parent: PrimitiveComponent): void {
    if (parent.componentName !== "Chip") {
      throw new Error(
        "<internalcircuit> must be provided through a <chip internalCircuit={...}> prop",
      )
    }
    super.onAddToParent(parent)
  }

  getPackagePort(selector: string): Port | null {
    const packagePinMatch = selector.trim().match(/^pin\.([^\s>]+)$/)
    if (!packagePinMatch) return null

    const packagePinName = packagePinMatch[1]
    const packageComponent = this.parent
    if (!packageComponent) return null

    return (
      (packageComponent.children.find(
        (child) =>
          child.componentName === "Port" &&
          (child as Port).isMatchingNameOrAlias(packagePinName),
      ) as Port | undefined) ?? null
    )
  }

  override runRenderPhaseForChildren(phase: RenderPhase): void {
    // The owning chip is the only physical component. Internal children still
    // run source, schematic, connectivity, and simulation phases, but all PCB,
    // CAD, footprint-fetching, and parts-engine work stops at this boundary.
    if (phase.startsWith("Pcb") || nonPcbPhysicalChildRenderPhases.has(phase))
      return
    super.runRenderPhaseForChildren(phase)
  }
}
