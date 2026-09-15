import { schematicSymbolProps } from "@tscircuit/props"
import { type SchSymbol, symbols } from "schematic-symbols"
import { getPinNumberFromLabels } from "../../../utils/getPortFromHints"
import { getRotatedSymbolName } from "lib/utils/schematic/getRotatedSymbolName"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { Port } from "../Port"
import { SchematicSymbol_doInitialSchematicComponentRender } from "./SchematicSymbol_doInitialSchematicComponentRender"
import { SchematicSymbol_doInitialPortMatching } from "./SchematicSymbol_doInitialPortMatching"

/**
 * Whether replacing `originalName` with `variantName` (the name
 * `getRotatedSymbolName` suggests for a `rotation`-degree turn) is
 * geometrically faithful: every port of the original symbol must land exactly
 * on the corresponding port of the variant, when rotated by either `+rotation`
 * or `-rotation` degrees. Directional variants like `..._left`/`..._right` are
 * mirror images, so e.g. `opamp_with_power_left` rotated 180° does NOT equal
 * `opamp_with_power_right` (the inverting/non-inverting inputs would not swap).
 * In that case core must keep the literal symbol and rotate its ports
 * geometrically instead. Conversely `n_channel_e_mosfet_transistor_horz`
 * rotated 90° IS `..._vert` (the variant is drawn at -90°), so the existing
 * name-substitution behavior is preserved for families whose variants are true
 * rotations.
 */
function isRotationFaithful(
  originalName: keyof typeof symbols,
  variantName: keyof typeof symbols,
  rotation: number,
): boolean {
  const original = symbols[originalName]
  const variant = symbols[variantName]
  if (!original || !variant) return false

  for (const angle of [rotation, -rotation]) {
    const angleRad = (angle * Math.PI) / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    let allPortsMatch = true
    for (const port of original.ports) {
      const dx = port.x - original.center.x
      const dy = port.y - original.center.y
      const rotated = {
        x: original.center.x + dx * cos - dy * sin,
        y: original.center.y + dx * sin + dy * cos,
      }
      const counterpart = variant.ports.find(
        (variantPort) =>
          variantPort.labels.some((label) => port.labels.includes(label)) &&
          Math.abs(variantPort.x - rotated.x) < 1e-6 &&
          Math.abs(variantPort.y - rotated.y) < 1e-6,
      )
      if (!counterpart) {
        allPortsMatch = false
        break
      }
    }
    if (allPortsMatch) return true
  }
  return false
}

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  /**
   * Normalized `schRotation` (0-360, multiple of 90). Returns 0 when no
   * rotation was given.
   */
  getNormalizedSchRotation(): number {
    const { schRotation } = this._parsedProps
    if (schRotation === undefined) return 0
    let rotation: number =
      typeof schRotation === "string" ? parseFloat(schRotation) : schRotation
    rotation = rotation % 360
    if (rotation < 0) rotation += 360
    if (rotation % 90 !== 0) {
      throw new Error(
        `Schematic rotation ${schRotation} is not supported for ${this.componentName}`,
      )
    }
    return rotation
  }

  /**
   * Returns the rotation that must be applied geometrically to the symbol's
   * ports (and NOT absorbed by a name substitution). When the rotated name
   * variant is a faithful geometric rotation, the rotation is absorbed by the
   * symbol name and this returns 0.
   */
  getSchematicRotation(): number {
    const rotation = this.getNormalizedSchRotation()
    if (!rotation) return 0
    const literalName = this._parsedProps.symbolName as keyof typeof symbols
    if (!literalName) return rotation
    const rotatedVariant = getRotatedSymbolName(literalName, rotation)
    if (
      rotatedVariant &&
      rotatedVariant !== literalName &&
      rotatedVariant in symbols &&
      isRotationFaithful(literalName, rotatedVariant as keyof typeof symbols, rotation)
    ) {
      return 0
    }
    return rotation
  }

  _getSchematicSymbolName(): keyof typeof symbols | undefined {
    const literalName = this._parsedProps.symbolName as keyof typeof symbols
    if (!literalName) return super._getSchematicSymbolName()
    const rotation = this.getNormalizedSchRotation()
    if (!rotation) return literalName
    const rotatedVariant = getRotatedSymbolName(literalName, rotation)
    if (
      rotatedVariant &&
      rotatedVariant !== literalName &&
      rotatedVariant in symbols &&
      isRotationFaithful(literalName, rotatedVariant as keyof typeof symbols, rotation)
    ) {
      return rotatedVariant as keyof typeof symbols
    }
    return literalName
  }

  initPorts(): void {
    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!
    const shouldCreateSourcePort = !(
      this._parsedProps.chipRef && this._parsedProps.connections
    )

    for (const symbolPort of symbol.ports) {
      const pinNumber = getPinNumberFromLabels(symbolPort.labels)
      if (!pinNumber) {
        throw new Error(
          `Schematic symbol port must have a numeric pin label: ${symbolPort.labels.join("/")}`,
        )
      }
      const existingPort = this.ports.find(
        (port) => port._parsedProps.pinNumber === pinNumber,
      )
      if (existingPort) {
        existingPort.schematicSymbolPortDef = symbolPort
        continue
      }
      const aliases = symbolPort.labels.filter(
        (label) =>
          label !== pinNumber.toString() && label !== `pin${pinNumber}`,
      )
      const port = new Port(
        {
          pinNumber,
          aliases,
        },
        { shouldCreateSourcePort },
      )
      port.schematicSymbolPortDef = symbolPort
      this.add(port)
    }
  }

  doInitialInitializePortsFromChildren(): void {
    this.initPorts()
  }

  updateInitializePortsFromChildren(): void {
    this.initPorts()
  }

  get ports(): Port[] {
    return this.children.filter((child): child is Port => child instanceof Port)
  }

  getPortForSymbolPort(symbolPort: SchSymbol["ports"][number]): Port | null {
    return (
      this.ports.find((port) => port.schematicSymbolPortDef === symbolPort) ??
      null
    )
  }

  doInitialSourceRender(): void {
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
      display_name: this._parsedProps.displayName,
      are_pins_interchangeable: false,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialPortMatching(): void {
    SchematicSymbol_doInitialPortMatching(this)
  }

  doInitialSchematicComponentRender(): void {
    SchematicSymbol_doInitialSchematicComponentRender(this)
  }
}
