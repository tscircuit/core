import { spicemodelProps } from "@tscircuit/props"
import type {
  SimulationSpiceSubcircuitInput,
  SourceInvalidComponentPropertyErrorInput,
} from "circuit-json"
import { parseSpiceNetlist } from "spicets"
import { Port } from "./Port"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Spicemodel extends PrimitiveComponent<typeof spicemodelProps> {
  get config() {
    return {
      componentName: "Spicemodel",
      zodProps: spicemodelProps,
    }
  }

  doInitialSimulationRender() {
    const parent = this.parent
    if (!parent) return

    const parentSourceComponentId = parent.source_component_id
    if (!parentSourceComponentId) {
      this._insertSpiceModelError(
        "spicemodel must be attached to a source component.",
        this._parsedProps,
      )
      return
    }

    const { source, spicePinMapping } = this._parsedProps
    const subckt = parseSpiceNetlist(source).subckts[0] ?? null
    const spicePinNames = subckt?.pins.map((pin) => pin.name)
    if (!subckt || !spicePinNames || spicePinNames.length === 0) {
      this._insertSpiceModelError(
        "spicemodel source must contain a .subckt declaration with a model name and pins.",
        source,
      )
      return
    }

    const mapping = spicePinMapping ?? {}
    for (const spicePinName of Object.keys(mapping)) {
      if (!spicePinNames.includes(spicePinName)) {
        this._insertSpiceModelError(
          `spicePinMapping references SPICE pin "${spicePinName}", but it is not present in .subckt ${subckt.name}.`,
          mapping,
        )
        return
      }
    }

    const spicePinToSourcePortMap: Record<string, string> = {}
    const seenSourcePortIds = new Set<string>()

    for (const spicePinName of spicePinNames) {
      const componentPinName = mapping[spicePinName] ?? spicePinName
      const matchingPorts = parent
        .selectAll("port")
        .filter(
          (port): port is Port =>
            port instanceof Port && port.isMatchingAnyOf([componentPinName]),
        )

      if (matchingPorts.length !== 1 || !matchingPorts[0].source_port_id) {
        this._insertSpiceModelError(
          `Could not resolve SPICE pin "${spicePinName}" to exactly one component port using "${componentPinName}".`,
          mapping,
        )
        return
      }

      const sourcePortId = matchingPorts[0].source_port_id
      if (seenSourcePortIds.has(sourcePortId)) {
        this._insertSpiceModelError(
          `spicePinMapping maps more than one SPICE pin to component port "${componentPinName}".`,
          mapping,
        )
        return
      }

      seenSourcePortIds.add(sourcePortId)
      spicePinToSourcePortMap[spicePinName] = sourcePortId
    }

    this.root!.db.simulation_spice_subcircuit.insert({
      source_component_id: parentSourceComponentId,
      spice_pin_to_source_port_map: spicePinToSourcePortMap,
      subcircuit_source: source,
    } satisfies Omit<
      SimulationSpiceSubcircuitInput,
      "type" | "simulation_spice_subcircuit_id"
    >)
  }

  private _insertSpiceModelError(
    message: string,
    propertyValue?: SourceInvalidComponentPropertyErrorInput["property_value"],
  ) {
    this.root!.db.source_invalid_component_property_error.insert({
      source_component_id: this.parent?.source_component_id || "",
      property_name: "spiceModel",
      property_value: propertyValue,
      message,
      error_type: "source_invalid_component_property_error",
    })
  }
}
