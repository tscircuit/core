import {
  type PartsEngine,
  type SupplierPartNumbers,
  resolveManufacturerPartNumber,
  supplierProps,
} from "@tscircuit/props"
import { source_pin_attributes } from "circuit-json"
import { fetchPartCircuitJsonWithDatasheet } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import type { NormalComponent } from "./NormalComponent"
import { getImportedInternallyConnectedPinNames } from "lib/utils/get-imported-internally-connected-pin-names"

/** Fetch comparison facts without importing the supplier's footprint or changing defaults. */
export const NormalComponent_fetchDatasheetForValidation = (
  component: NormalComponent,
) => {
  if (!["Chip", "PushButton", "OpAmp"].includes(component.config.componentName))
    return
  if (component._hasStartedPinAttributesFetch) return
  if (component.getInheritedProperty("partsEngineDisabled")) return
  if (component.getInheritedProperty("bomDisabled")) return
  if (component._importedInternallyConnectedPinNames !== undefined) return
  if (
    component._importedSourcePorts.some((port) =>
      Object.values(source_pin_attributes.parse(port)).some(
        (value) => value !== undefined,
      ),
    )
  )
    return
  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  if (!partsEngine?.fetchPartCircuitJson) return
  // Supplier footprint imports already requested datasheet enrichment, even
  // when it failed or returned no electrical metadata. Do not retry that fetch.
  const footprint = component.resolveFootprint()
  const supplierPartNumbers = component._parsedProps.supplierPartNumbers as
    | SupplierPartNumbers
    | undefined
  if (
    supplierProps.shape.supplierPartNumbers
      .unwrap()
      .keySchema.options.some(
        (supplierName) =>
          typeof component.root?.platform?.footprintLibraryMap?.[
            supplierName
          ] !== "function" &&
          supplierPartNumbers?.[supplierName]?.some(
            (partNumber) => footprint === `${supplierName}:${partNumber}`,
          ),
      )
  )
    return
  const supplierPartNumber = Object.values(supplierPartNumbers ?? {}).flat()[0]
  const manufacturerPartNumber = resolveManufacturerPartNumber(
    component._parsedProps,
  )
  if (!supplierPartNumber && !manufacturerPartNumber) return
  component._hasStartedPinAttributesFetch = true
  component._queueAsyncEffect(
    "fetch-datasheet-validation-metadata",
    async () => {
      try {
        const partCircuitJson = await fetchPartCircuitJsonWithDatasheet(
          {
            fetchPartCircuitJson: partsEngine.fetchPartCircuitJson!,
            supplierPartNumber,
            manufacturerPartNumber,
          },
          component,
        )
        component._fetchedSourcePortsForPinAttributes =
          partCircuitJson?.filter(
            (element) => element.type === "source_port",
          ) ?? []
        component._fetchedInternallyConnectedPinNames =
          getImportedInternallyConnectedPinNames(partCircuitJson ?? [])
        component._markDirty("SourceDesignRuleChecks")
      } catch {
        // Optional comparison facts must not prevent a custom footprint rendering.
        // No fetched facts means no claim that the user's configuration was verified.
      }
    },
  )
}
