import {
  type PartsEngine,
  resolveManufacturerPartNumber,
  supplierProps,
} from "@tscircuit/props"
import { source_pin_attributes } from "circuit-json"
import { fetchPartCircuitJsonWithDatasheet } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import type { Chip } from "./Chip"

/** Fetch comparison facts without importing the supplier's footprint or changing defaults. */
export const Chip_fetchPinAttributesForValidation = (chip: Chip<string>) => {
  if (chip.config.componentName !== "Chip") return
  if (chip._hasStartedPinAttributesFetch) return
  if (!Object.keys(chip._parsedProps.pinAttributes ?? {}).length) return
  if (chip.getInheritedProperty("partsEngineDisabled")) return
  if (chip.getInheritedProperty("bomDisabled")) return
  if (
    chip._importedSourcePorts.some((port) =>
      Object.values(source_pin_attributes.parse(port)).some(
        (value) => value !== undefined,
      ),
    )
  )
    return
  const partsEngine = chip.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  if (!partsEngine?.fetchPartCircuitJson) return
  // Supplier footprint imports already requested datasheet enrichment, even
  // when it failed or returned no electrical metadata. Do not retry that fetch.
  const footprint = chip.resolveFootprint()
  if (
    supplierProps.shape.supplierPartNumbers
      .unwrap()
      .keySchema.options.some(
        (supplierName) =>
          typeof chip.root?.platform?.footprintLibraryMap?.[supplierName] !==
            "function" &&
          chip._parsedProps.supplierPartNumbers?.[supplierName]?.some(
            (partNumber) => footprint === `${supplierName}:${partNumber}`,
          ),
      )
  )
    return
  const supplierPartNumber = Object.values(
    chip._parsedProps.supplierPartNumbers ?? {},
  ).flat()[0]
  const manufacturerPartNumber = resolveManufacturerPartNumber(
    chip._parsedProps,
  )
  if (!supplierPartNumber && !manufacturerPartNumber) return
  chip._hasStartedPinAttributesFetch = true
  chip._queueAsyncEffect("fetch-chip-pin-metadata", async () => {
    try {
      const partCircuitJson = await fetchPartCircuitJsonWithDatasheet(
        {
          fetchPartCircuitJson: partsEngine.fetchPartCircuitJson!,
          supplierPartNumber,
          manufacturerPartNumber,
        },
        chip,
      )
      chip._fetchedSourcePortsForPinAttributes =
        partCircuitJson?.filter((element) => element.type === "source_port") ??
        []
      chip._markDirty("SourceDesignRuleChecks")
    } catch {
      // Optional comparison facts must not prevent a custom footprint rendering.
      // No fetched facts means no claim that the user's configuration was verified.
    }
  })
}
