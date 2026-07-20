import type { RenderPhase } from "../base-components/Renderable"
import { InternalCircuitTrace } from "../primitive-components/InternalCircuitTrace"
import { Mosfet } from "./Mosfet"

const nonPcbPhysicalRenderPhases = new Set<RenderPhase>([
  "FetchPartFootprint",
  "ResolveFootprintPinLabels",
  "ValidatePcbCoordinates",
  "PanelBoardLayout",
  "PanelLayout",
  "SilkscreenOverlapAdjustment",
  "CadModelRender",
  "PartsEngineRender",
  "SupplierFootprintMismatchWarning",
])

const isPhysicalRenderPhase = (phase: RenderPhase): boolean =>
  phase.startsWith("Pcb") || nonPcbPhysicalRenderPhases.has(phase)

export class InternalCircuitMosfet extends Mosfet {
  override runRenderPhase(phase: RenderPhase): void {
    if (isPhysicalRenderPhase(phase)) {
      this.renderPhaseStates[phase].initialized = true
      this.renderPhaseStates[phase].dirty = false
      return
    }
    super.runRenderPhase(phase)
  }

  override runRenderPhaseForChildren(phase: RenderPhase): void {
    if (isPhysicalRenderPhase(phase)) return
    super.runRenderPhaseForChildren(phase)
  }

  override getNameForDuplicateCheck(): string | undefined {
    return this._getSourceComponentName()
  }

  protected override _getSourceComponentName(): string | undefined {
    const owningChipName = this.parent?.parent?.name
    const internalMosfetName = this.name
    if (!owningChipName || !internalMosfetName) return internalMosfetName
    return `${owningChipName}${internalMosfetName}`
  }

  override _createTracesFromConnectionsProp(): void {
    const props = this._parsedProps
    if (!props.connections) return

    for (const [pinName, target] of Object.entries(props.connections)) {
      const targets = Array.isArray(target) ? target : [target]
      for (const targetPath of targets) {
        this.add(
          new InternalCircuitTrace({
            from: `.${this.name} > .${pinName}`,
            to: String(targetPath),
          }),
        )
      }
    }
  }
}
