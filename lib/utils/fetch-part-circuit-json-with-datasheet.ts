import type { PartsEngine } from "@tscircuit/props"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"

/** Optional request extension understood by parts-engine 0.0.36. */
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
  const legacyRequest = {
    supplierPartNumber,
    manufacturerPartNumber,
    platformFetch: sourcePortOwner.root?.platform?.platformFetch,
  }
  const request: DatasheetPartCircuitJsonRequest = {
    ...legacyRequest,
    includeDatasheetInformation: true,
  }
  try {
    return await fetchPartCircuitJson(request)
  } catch (error) {
    const fallbackRequest: DatasheetPartCircuitJsonRequest = {
      ...request,
      includeDatasheetInformation: false,
    }
    let circuitJson: Awaited<ReturnType<typeof fetchPartCircuitJson>>
    let usedLegacyRequest = false
    try {
      circuitJson = await fetchPartCircuitJson(fallbackRequest)
    } catch {
      // Strict legacy engines reject the new option even when it is false.
      // Keep the explicit false attempt first for engines that enable
      // datasheet enrichment by default in their constructor.
      circuitJson = await fetchPartCircuitJson(legacyRequest)
      usedLegacyRequest = true
    }
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
    const reason = usedLegacyRequest
      ? "the parts engine only accepted a request without the datasheet option"
      : error instanceof Error
        ? error.message
        : String(error)
    const message = `Datasheet information for ${sourcePortOwner.getDisplayName()} could not be fetched: ${reason}. Pin attributes may not be populated.`
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
