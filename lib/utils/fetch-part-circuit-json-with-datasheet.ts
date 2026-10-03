import type { PartsEngine } from "@tscircuit/props"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"

/** Optional request extension understood by parts-engine 0.0.36 and ignored by older engines. */
export type DatasheetPartCircuitJsonRequest = Parameters<
  NonNullable<PartsEngine["fetchPartCircuitJson"]>
>[0] & { includeDatasheetInformation?: boolean }

/** Optional enrichment must not discard an otherwise available footprint. */
export const fetchPartCircuitJsonWithDatasheet = async (
  {
    fetchPartCircuitJson,
    supplierPartNumber,
    manufacturerPartNumber,
  }: {
    fetchPartCircuitJson: NonNullable<PartsEngine["fetchPartCircuitJson"]>
    supplierPartNumber?: string
    manufacturerPartNumber?: string
  },
  sourcePortOwner: NormalComponent,
) => {
  const request: DatasheetPartCircuitJsonRequest = {
    supplierPartNumber,
    manufacturerPartNumber,
    platformFetch: sourcePortOwner.root?.platform?.platformFetch,
    includeDatasheetInformation: true,
  }
  try {
    return await fetchPartCircuitJson(request)
  } catch (error) {
    const fallbackRequest: DatasheetPartCircuitJsonRequest = {
      ...request,
      includeDatasheetInformation: false,
    }
    const circuitJson = await fetchPartCircuitJson(fallbackRequest)
    if (!circuitJson?.length) throw error
    const manufacturerPartNumbers = circuitJson.flatMap((element) =>
      element.type === "source_component" && element.manufacturer_part_number
        ? [element.manufacturer_part_number]
        : [],
    )
    // A fallback must not accept a different voltage variant or part identity.
    if (
      manufacturerPartNumber &&
      manufacturerPartNumbers.some(
        (importedManufacturerPartNumber) =>
          importedManufacturerPartNumber.trim().toLowerCase() !==
          manufacturerPartNumber.trim().toLowerCase(),
      )
    )
      throw error
    const message = `Datasheet information for ${sourcePortOwner.getString()} could not be fetched: ${error instanceof Error ? error.message : String(error)}. Pin attributes may not be populated.`
    if (sourcePortOwner.source_component_id && sourcePortOwner.root) {
      sourcePortOwner.root.db.source_property_ignored_warning.insert({
        source_component_id: sourcePortOwner.source_component_id,
        property_name: "pinAttributes",
        message,
        error_type: "source_property_ignored_warning",
      })
    } else {
      console.warn(message)
    }
    return circuitJson
  }
}
