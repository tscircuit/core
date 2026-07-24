import { schematicSymbolProps } from "@tscircuit/props"
import type { RenderPhase } from "lib/components/base-components/Renderable"
import { getRotatedSymbolName } from "lib/utils/schematic/getRotatedSymbolName"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../../base-components/NormalComponent"

export class SchematicSymbol extends NormalComponent<
  typeof schematicSymbolProps
> {
  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  runRenderPhaseForChildren(phase: RenderPhase): void {
    if (phase.startsWith("Pcb")) return
    super.runRenderPhaseForChildren(phase)
  }

  doInitialSourceRender(): void {
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
      are_pins_interchangeable: false,
    })

    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialPcbComponentRender(): void {
    // A schematicsymbol has no PCB representation.
  }

  override _getSchematicSymbolName(): keyof typeof symbols | undefined {
    const { symbolName, schRotation } = this._parsedProps
    const normalizedRotation = (((schRotation ?? 0) % 360) + 360) % 360

    if (schRotation !== undefined && normalizedRotation % 90 !== 0) {
      throw new Error(
        `Schematic rotation ${schRotation} is not supported for ${this.componentName}`,
      )
    }

    if (symbolName in symbols) {
      const rotatedSymbolName = getRotatedSymbolName(
        symbolName,
        normalizedRotation,
      )
      if (rotatedSymbolName && rotatedSymbolName in symbols) {
        return rotatedSymbolName as keyof typeof symbols
      }
      return symbolName as keyof typeof symbols
    }

    return super._getSchematicSymbolName()
  }

  /*
   * This first implementation intentionally treats <schematicsymbol> as a
   * standalone schematic element. chipRef-based connection mapping will be
   * implemented separately. displayName is intentionally not written to its
   * temporary source representation; rendering it will be implemented without
   * special-casing schematic_component.
   */
}
