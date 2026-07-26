import { type CrystalPinLabels, crystalProps } from "@tscircuit/props"
import type {
  SourcePort,
  SourceSimpleCrystalInput,
  SourceTrace,
} from "circuit-json"
import { formatSiUnit } from "format-si-unit"
import { type BaseSymbolName, type Ftype } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

type CrystalPorts = CrystalPinLabels
type SourcePortId = SourcePort["source_port_id"]
type SubcircuitConnectivityMapKey = NonNullable<
  SourceTrace["subcircuit_connectivity_map_key"]
>

const DEFAULT_CRYSTAL_MAX_TRACE_LENGTH_MM = 10

export class Crystal extends NormalComponent<
  typeof crystalProps,
  CrystalPorts
> {
  get config() {
    const symbolName =
      this.props.symbolName ??
      ((this.props.pinVariant === "four_pin"
        ? "crystal_4pin"
        : "crystal") as BaseSymbolName)

    return {
      schematicSymbolName: symbolName,
      componentName: "Crystal",
      zodProps: crystalProps,
      sourceFtype: "simple_crystal" as Ftype,
    }
  }

  initPorts() {
    const additionalAliases: Record<`pin${number}`, string[]> =
      this.props.pinVariant === "four_pin"
        ? {
            pin1: ["left1", "1"],
            pin2: ["top1", "2", "gnd1"],
            pin3: ["right1", "3"],
            pin4: ["bottom1", "4", "gnd2"],
          }
        : {
            pin1: ["pos", "left"],
            pin2: ["neg", "right"],
          }

    super.initPorts({
      additionalAliases,
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const freqDisplay = `${formatSiUnit(this._parsedProps.frequency)}Hz`
    if (this._parsedProps.loadCapacitance) {
      return `${freqDisplay} / ${formatSiUnit(
        this._parsedProps.loadCapacitance,
      )}F`
    }
    return freqDisplay
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: "simple_crystal",
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      frequency: props.frequency,
      load_capacitance: props.loadCapacitance,
      pin_variant: props.pinVariant || "two_pin",
      are_pins_interchangeable: (props.pinVariant || "two_pin") === "two_pin",
      display_name: props.displayName,
    } as SourceSimpleCrystalInput)

    this.source_component_id = source_component.source_component_id
  }

  override doInitialSourceDesignRuleChecks(): void {
    super.doInitialSourceDesignRuleChecks()
    if (!this.source_component_id) return

    const { db } = this.root!
    const maximumTraceLength =
      this._parsedProps.maxTraceLength ?? DEFAULT_CRYSTAL_MAX_TRACE_LENGTH_MM
    const crystalSourcePortIds = new Set<SourcePortId>()
    const crystalConnectivityMapKeys = new Set<SubcircuitConnectivityMapKey>()

    for (const sourcePort of db.source_port.list()) {
      if (sourcePort.source_component_id !== this.source_component_id) continue

      crystalSourcePortIds.add(sourcePort.source_port_id)
      if (sourcePort.subcircuit_connectivity_map_key) {
        crystalConnectivityMapKeys.add(
          sourcePort.subcircuit_connectivity_map_key,
        )
      }
    }

    for (const sourceTrace of db.source_trace.list()) {
      const isDirectlyConnectedToCrystal =
        sourceTrace.connected_source_port_ids.some((sourcePortId) =>
          crystalSourcePortIds.has(sourcePortId),
        )
      const isOnCrystalNet =
        sourceTrace.subcircuit_connectivity_map_key !== undefined &&
        crystalConnectivityMapKeys.has(
          sourceTrace.subcircuit_connectivity_map_key,
        )

      if (!isDirectlyConnectedToCrystal && !isOnCrystalNet) continue
      if (
        typeof sourceTrace.max_length === "number" &&
        sourceTrace.max_length <= maximumTraceLength
      ) {
        continue
      }

      db.source_trace.update(sourceTrace.source_trace_id, {
        max_length: maximumTraceLength,
      })
    }
  }
}
