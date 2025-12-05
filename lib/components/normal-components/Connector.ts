import { connectorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import type { z } from "zod"
import type { SchematicPortArrangement } from "@tscircuit/props"
import { Trace } from "../primitive-components/Trace/Trace"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { unknown_error_finding_part } from "circuit-json"

/**
 * Standard USB-C pin definitions following USB Type-C specification.
 * USB-C has 24 pins with the following standard naming convention.
 *
 * Note: USB-C is reversible, so some signals appear twice (e.g., DP/DP2, DM/DM2).
 * The aliases include common manufacturer naming conventions like DP2, DM2 for
 * the secondary data pins on 16-pin connectors.
 */
export const USB_C_STANDARD_PINS = {
  // USB 2.0 Data (D+/D-) - includes aliases for 16-pin connector secondary pins
  DP: { pinNumber: 1, aliases: ["D+", "dp", "data_plus", "DP1", "DP2", "D+2"] },
  DM: {
    pinNumber: 2,
    aliases: ["D-", "dm", "data_minus", "DM1", "DM2", "D-2"],
  },

  // Configuration Channel
  CC1: { pinNumber: 3, aliases: ["cc1", "config_channel_1"] },
  CC2: { pinNumber: 4, aliases: ["cc2", "config_channel_2"] },

  // Power
  VBUS1: { pinNumber: 5, aliases: ["vbus", "vbus1", "power"] },
  VBUS2: { pinNumber: 6, aliases: ["vbus2"] },
  VBUS3: { pinNumber: 7, aliases: ["vbus3"] },
  VBUS4: { pinNumber: 8, aliases: ["vbus4"] },

  // Ground
  GND1: { pinNumber: 9, aliases: ["gnd", "gnd1", "ground"] },
  GND2: { pinNumber: 10, aliases: ["gnd2"] },
  GND3: { pinNumber: 11, aliases: ["gnd3"] },
  GND4: { pinNumber: 12, aliases: ["gnd4"] },

  // Sideband Use
  SBU1: { pinNumber: 13, aliases: ["sbu1", "sideband_use_1"] },
  SBU2: { pinNumber: 14, aliases: ["sbu2", "sideband_use_2"] },

  // SuperSpeed TX (USB 3.x)
  TX1_PLUS: { pinNumber: 15, aliases: ["tx1+", "sstx1p"] },
  TX1_MINUS: { pinNumber: 16, aliases: ["tx1-", "sstx1n"] },
  TX2_PLUS: { pinNumber: 17, aliases: ["tx2+", "sstx2p"] },
  TX2_MINUS: { pinNumber: 18, aliases: ["tx2-", "sstx2n"] },

  // SuperSpeed RX (USB 3.x)
  RX1_PLUS: { pinNumber: 19, aliases: ["rx1+", "ssrx1p"] },
  RX1_MINUS: { pinNumber: 20, aliases: ["rx1-", "ssrx1n"] },
  RX2_PLUS: { pinNumber: 21, aliases: ["rx2+", "ssrx2p"] },
  RX2_MINUS: { pinNumber: 22, aliases: ["rx2-", "ssrx2n"] },

  // VCONN (power for cable electronics)
  VCONN: { pinNumber: 23, aliases: ["vconn"] },

  // Shield
  SHIELD: { pinNumber: 24, aliases: ["shield", "shd"] },
} as const

/**
 * Standard M.2 connector pin definitions (commonly 67 or 75 pins).
 * This is a simplified version for common use cases.
 */
export const M2_STANDARD_PINS = {
  // This would be expanded based on specific M.2 key types (B, M, E, etc.)
  // For now, basic power and data pins
  VCC_3V3: { pinNumber: 1, aliases: ["3v3", "vcc", "power_3v3"] },
  GND: { pinNumber: 2, aliases: ["gnd", "ground"] },
} as const

export type ConnectorStandard = "usb_c" | "m2"

export interface StandardPinDefinition {
  pinNumber: number
  aliases: readonly string[]
}

const STANDARD_PIN_MAPS: Record<
  ConnectorStandard,
  Record<string, StandardPinDefinition>
> = {
  usb_c: USB_C_STANDARD_PINS,
  m2: M2_STANDARD_PINS,
}

/**
 * Get the standard pins for a given connector standard.
 * This maps the standard pin names (like DP, DM for USB-C) to pin numbers.
 */
export function getStandardPins(
  standard: ConnectorStandard,
): Record<string, StandardPinDefinition> {
  return STANDARD_PIN_MAPS[standard] || {}
}

/**
 * Connector component for standard connectors like USB-C, M.2, etc.
 *
 * When a `standard` prop is provided, the component automatically:
 * 1. Creates ports with standard pin names (e.g., DP, DM, CC1, CC2 for USB-C)
 * 2. Maps pins according to the standard specification
 * 3. Enables the parts engine to find compatible parts
 *
 * @example
 * // USB-C connector with standard pin mapping
 * <Connector standard="usb_c" name="USB1" />
 *
 * // Access pins using standard names
 * <Trace from=".USB1 > .DP" to=".chip > .USB_DP" />
 */
export class Connector<
  PinLabels extends string = never,
> extends NormalComponent<typeof connectorProps, PinLabels> {
  get config() {
    return {
      componentName: "Connector",
      zodProps: connectorProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  /**
   * Get the standard being used for this connector.
   */
  get standard(): ConnectorStandard | undefined {
    return this._parsedProps.standard
  }

  /**
   * Get the standard pin definitions for this connector's standard.
   */
  getStandardPinDefinitions(): Record<string, StandardPinDefinition> | null {
    if (!this.standard) return null
    return getStandardPins(this.standard)
  }

  initPorts(): void {
    const { _parsedProps: props } = this
    const standard = props.standard

    if (standard) {
      // Create ports based on the connector standard
      const standardPins = getStandardPins(standard)

      for (const [pinName, pinDef] of Object.entries(standardPins)) {
        // Check if user has provided custom labels for this pin
        const userLabels =
          props.pinLabels?.[pinDef.pinNumber] ??
          props.pinLabels?.[`pin${pinDef.pinNumber}`]

        const primaryLabel = userLabels
          ? Array.isArray(userLabels)
            ? userLabels[0]
            : userLabels
          : pinName

        const additionalAliases = userLabels
          ? Array.isArray(userLabels)
            ? userLabels.slice(1)
            : []
          : []

        this.add(
          new Port({
            pinNumber: pinDef.pinNumber,
            name: primaryLabel,
            aliases: [
              `pin${pinDef.pinNumber}`,
              pinName,
              ...pinDef.aliases,
              ...additionalAliases,
            ],
          }),
        )
      }
    } else {
      // No standard specified, use manual pin labels
      super.initPorts()
    }
  }

  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    const { _parsedProps: props } = this

    // If user specified a port arrangement, use that
    if (props.schPortArrangement) {
      return props.schPortArrangement
    }

    const standard = props.standard

    if (standard === "usb_c") {
      // Default arrangement for USB-C connector in schematic
      // Show commonly used pins on left, less common on right
      return {
        leftSide: {
          direction: "top-to-bottom",
          pins: ["VBUS1", "DP", "DM", "CC1", "CC2", "GND1"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [
            "SBU1",
            "SBU2",
            "TX1_PLUS",
            "TX1_MINUS",
            "RX1_PLUS",
            "RX1_MINUS",
          ],
        },
      }
    }

    // Fall back to default behavior
    const schDirection = props.schDirection ?? "right"
    const pinCount = this._getPinCount()

    if (schDirection === "left") {
      return {
        leftSide: {
          direction: "top-to-bottom",
          pins: Array.from({ length: pinCount }, (_, i) => `pin${i + 1}`),
        },
      }
    }

    return {
      rightSide: {
        direction: "top-to-bottom",
        pins: Array.from({ length: pinCount }, (_, i) => `pin${i + 1}`),
      },
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_connector",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      // Additional connector-specific properties
      connector_standard: props.standard,
    } as any)

    this.source_component_id = source_component.source_component_id
  }

  doInitialPartsEngineRender(): void {
    const standard = this._parsedProps.standard
    if (!standard) {
      // No standard specified, fall back to base behavior
      super.doInitialPartsEngineRender()
      return
    }

    if (this.props.doNotPlace) return
    const partsEngine = this.getInheritedProperty("partsEngine")
    if (!partsEngine?.findStandardPart) {
      // Parts engine doesn't support findStandardPart, fall back to base behavior
      super.doInitialPartsEngineRender()
      return
    }

    const { db } = this.root!
    const source_component = db.source_component.get(this.source_component_id!)
    if (!source_component) return
    if (source_component.supplier_part_numbers) return

    const resultMaybePromise = partsEngine.findStandardPart({
      standard,
      sourceComponent: source_component,
    })

    if (!(resultMaybePromise instanceof Promise)) {
      this._applyStandardPartResult(resultMaybePromise)
      return
    }

    this._queueAsyncEffect("find-standard-part", async () => {
      await resultMaybePromise
        .then((result) => {
          this._asyncStandardPartResult = result
          this._markDirty("PartsEngineRender")
        })
        .catch((error: Error) => {
          this._asyncStandardPartResult = null
          const errorObj = unknown_error_finding_part.parse({
            type: "unknown_error_finding_part",
            message: `Failed to find standard part for ${this.getString()} (${standard}): ${error.message}`,
            source_component_id: this.source_component_id,
            subcircuit_id: this.getSubcircuit()?.subcircuit_id,
          })
          db.unknown_error_finding_part.insert(errorObj)
          this._markDirty("PartsEngineRender")
        })
    })
  }

  updatePartsEngineRender(): void {
    const standard = this._parsedProps.standard
    if (!standard || this._asyncStandardPartResult === undefined) {
      super.updatePartsEngineRender()
      return
    }

    if (this.props.doNotPlace) return
    const { db } = this.root!

    const source_component = db.source_component.get(this.source_component_id!)
    if (!source_component) return
    if (source_component.supplier_part_numbers) return

    this._applyStandardPartResult(this._asyncStandardPartResult)
  }

  private _asyncStandardPartResult:
    | { supplierPartNumbers: Record<string, string[]>; footprint?: unknown[] }
    | null
    | undefined

  private _applyStandardPartResult(
    result: {
      supplierPartNumbers: Record<string, string[]>
      footprint?: unknown[]
    } | null,
  ): void {
    if (!result) return

    const { db } = this.root!
    const { pcbRotation, pinLabels } = this.props

    // Update supplier part numbers on the source component
    if (result.supplierPartNumbers) {
      db.source_component.update(this.source_component_id!, {
        supplier_part_numbers: result.supplierPartNumbers,
      })
    }

    // If footprint Circuit JSON is provided, create components from it
    if (result.footprint && Array.isArray(result.footprint)) {
      const fpComponents = createComponentsFromCircuitJson(
        {
          componentName: this.name,
          componentRotation: String(pcbRotation ?? "0"),
          footprinterString: `standard:${this._parsedProps.standard}`,
          pinLabels,
        },
        result.footprint as Parameters<
          typeof createComponentsFromCircuitJson
        >[1],
      )
      this.addAll(fpComponents)

      // Ensure existing Ports re-run PcbPortRender now that pads exist
      for (const child of this.children) {
        if (child.componentName === "Port") {
          child._markDirty?.("PcbPortRender")
        }
      }
      this._markDirty("InitializePortsFromChildren")
    }
  }

  doInitialCreateTracesFromProps(): void {
    const { _parsedProps: props } = this

    // Handle internally connected pins (common for connectors)
    if (props.internallyConnectedPins) {
      for (const pinGroup of props.internallyConnectedPins) {
        // Connect all pins in the group to each other
        for (let i = 0; i < pinGroup.length - 1; i++) {
          const pin1 =
            typeof pinGroup[i] === "number" ? `pin${pinGroup[i]}` : pinGroup[i]
          const pin2 =
            typeof pinGroup[i + 1] === "number"
              ? `pin${pinGroup[i + 1]}`
              : pinGroup[i + 1]

          this.add(
            new Trace({
              from: `${this.getSubcircuitSelector()} > port.${pin1}`,
              to: `${this.getSubcircuitSelector()} > port.${pin2}`,
            }),
          )
        }
      }
    }

    this._createTracesFromConnectionsProp()
  }
}
