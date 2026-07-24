import { schematicSymbolProps } from "@tscircuit/props"
import { getRotatedSymbolName } from "lib/utils/schematic/getRotatedSymbolName"
import { symbols } from "schematic-symbols"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { SchematicSymbol_doInitialSchematicComponentRender } from "./SchematicSymbol_doInitialSchematicComponentRender"

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  doInitialSchematicComponentRender(): void {
    SchematicSymbol_doInitialSchematicComponentRender(this)
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
   * implemented separately. displayName rendering is also deferred until its
   * Circuit JSON representation is defined.
   */
}
