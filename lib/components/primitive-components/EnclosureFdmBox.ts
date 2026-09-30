import { enclosureFdmBoxProps } from "@tscircuit/props"
import type { AssemblyEnclosureGeometry } from "@tscircuit/checks"
import type { CadCollisionError, SourceRuntimeError } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { EnclosureFdmBox_doInitialCadModelRender } from "./EnclosureFdmBox_doInitialCadModelRender"
import { getReferencedEnclosureBoard } from "./get-referenced-enclosure-board"
import { EnclosureFdmBox_doInitialAssemblyDesignRuleChecks } from "./EnclosureFdmBox_doInitialAssemblyDesignRuleChecks"

export class EnclosureFdmBox extends PrimitiveComponent<
  typeof enclosureFdmBoxProps
> {
  /** Explicit solver-owned enclosure/aperture associations; no name inference. */
  assemblyEnclosureGeometry?: AssemblyEnclosureGeometry
  _assemblyDrcRun = 0
  _assemblyDrcDiagnostics: (CadCollisionError | SourceRuntimeError)[] = []
  get config() {
    return {
      componentName: "EnclosureFdmBox",
      zodProps: enclosureFdmBoxProps,
    }
  }

  /** assembly.device is a product container, not a subcircuit naming scope. */
  override doInitialAssignNameToUnnamedComponents(): void {
    if ((this._parsedProps as { name?: string }).name) return
    let top: PrimitiveComponent = this
    while (top.parent instanceof PrimitiveComponent) top = top.parent
    const enclosureBoxes = [top, ...top.getDescendants()].filter(
      (component): component is EnclosureFdmBox =>
        component instanceof EnclosureFdmBox,
    )
    const index = enclosureBoxes.indexOf(this)
    this.fallbackUnassignedName = `unnamed_enclosure_fdm_box_${index === -1 ? 0 : index + 1}`
  }

  doInitialSourceRender(): void {
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialPcbComponentRender(): void {
    const root = this.root
    if (!root || root.pcbDisabled || !this.source_component_id) return

    const board = getReferencedEnclosureBoard(this, this._parsedProps.boardRef)
    const pcbBoard = board.pcb_board_id
      ? root.db.pcb_board.get(board.pcb_board_id)
      : null
    const center = pcbBoard?.center ?? board._getGlobalPcbPositionBeforeLayout()
    const pcbComponent = root.db.pcb_component.insert({
      center,
      width: 0,
      height: 0,
      layer: "top",
      rotation: 0,
      source_component_id: this.source_component_id,
      obstructs_within_bounds: false,
      do_not_place: true,
      is_allowed_to_be_off_board: true,
    })
    this.pcb_component_id = pcbComponent.pcb_component_id
  }

  doInitialCadModelRender(): void {
    EnclosureFdmBox_doInitialCadModelRender(this)
  }

  doInitialAssemblyDesignRuleChecks(): void {
    EnclosureFdmBox_doInitialAssemblyDesignRuleChecks(this)
  }

  updateAssemblyDesignRuleChecks(): void {
    EnclosureFdmBox_doInitialAssemblyDesignRuleChecks(this)
  }

  removeAssemblyDesignRuleChecks(): void {
    this._assemblyDrcRun++
    for (const diagnostic of this._assemblyDrcDiagnostics) {
      if (diagnostic.type === "cad_collision_error") {
        this.root?.db.cad_collision_error.delete(
          diagnostic.cad_collision_error_id,
        )
      } else {
        this.root?.db.source_runtime_error.delete(
          diagnostic.source_runtime_error_id,
        )
      }
    }
    this._assemblyDrcDiagnostics = []
  }
}
