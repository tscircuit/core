import type { PartsEngine } from "@tscircuit/props"
import type {
  AnyCircuitElement,
  SourcePinAttributes,
  SourcePort,
} from "circuit-json"
import externalFootprint from "./assets/external-0402-footprint.json"

export const getChipPinMetadataFixture = (
  pinAttributes: SourcePinAttributes[],
) => {
  const importedPorts: SourcePort[] = pinAttributes.map(
    (attributes, pinIndex) => ({
      type: "source_port",
      source_port_id: `imported_pin${pinIndex + 1}`,
      source_component_id: "generic_0",
      name: `pin${pinIndex + 1}`,
      pin_number: pinIndex + 1,
      ...attributes,
    }),
  )
  const importedCircuitJson = [
    ...externalFootprint,
    ...importedPorts,
  ] as AnyCircuitElement[]
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => {
      await Promise.resolve()
      return importedCircuitJson
    },
  }
  return { partsEngine, importedCircuitJson, importedPorts }
}
