import type { PartsEngine } from "@tscircuit/props"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { ZodError } from "zod"

/** Optional request extension understood by parts-engine 0.0.36. */
export type DatasheetPartCircuitJsonRequest = Parameters<
  NonNullable<PartsEngine["fetchPartCircuitJson"]>
>[0] & { includeDatasheetInformation?: boolean }

type FetchPartCircuitJson = NonNullable<PartsEngine["fetchPartCircuitJson"]>
type DatasheetPartCacheKey = `datasheet_part:${string}`
type DatasheetPartFetchResult = {
  circuitJson: Awaited<ReturnType<FetchPartCircuitJson>>
  datasheetFailureReason?: string
}

// Keep pending, fulfilled, empty, and rejected results for this circuit instance.
// Weak circuit ownership lets a fresh circuit retry, even with the same engine.
const chipDatasheetPartFetches = new WeakMap<
  IsolatedCircuit,
  WeakMap<
    FetchPartCircuitJson,
    Map<DatasheetPartCacheKey, Promise<DatasheetPartFetchResult>>
  >
>()

const fetchDatasheetPart = async (
  fetchPartCircuitJson: FetchPartCircuitJson,
  request: DatasheetPartCircuitJsonRequest,
): Promise<DatasheetPartFetchResult> => {
  const { supplierPartNumber, manufacturerPartNumber, platformFetch } = request
  const legacyRequest = {
    supplierPartNumber,
    manufacturerPartNumber,
    platformFetch,
  }
  try {
    return { circuitJson: await fetchPartCircuitJson(request) }
  } catch (error) {
    // Never turn a failed opt-out into enrichment via a modern engine's default.
    // Only strict legacy schemas rejecting the new key can omit that option.
    if (
      !request.includeDatasheetInformation &&
      !(
        error instanceof ZodError &&
        error.issues.some(
          (issue) =>
            issue.code === "unrecognized_keys" &&
            issue.keys.includes("includeDatasheetInformation"),
        )
      )
    )
      throw error
    const fallbackRequest: DatasheetPartCircuitJsonRequest = {
      ...request,
      includeDatasheetInformation: false,
    }
    let circuitJson: Awaited<ReturnType<typeof fetchPartCircuitJson>>
    let usedLegacyRequest = false
    try {
      // An unenriched request already tried false; only the legacy shape remains.
      usedLegacyRequest = !request.includeDatasheetInformation
      circuitJson = await fetchPartCircuitJson(
        usedLegacyRequest ? legacyRequest : fallbackRequest,
      )
    } catch {
      if (usedLegacyRequest) throw error
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
    return { circuitJson, datasheetFailureReason: reason }
  }
}

/** Geometry-only reads must override engine-level datasheet enrichment. */
export const fetchPartCircuitJsonWithoutDatasheet = async (
  fetchPartCircuitJson: FetchPartCircuitJson,
  request: DatasheetPartCircuitJsonRequest,
) => {
  const { circuitJson } = await fetchDatasheetPart(fetchPartCircuitJson, {
    ...request,
    includeDatasheetInformation: false,
  })
  return circuitJson
}

/** Optional enrichment must not discard an otherwise available footprint. */
export const fetchPartCircuitJsonWithDatasheet = async (
  {
    fetchPartCircuitJson,
    supplierPartNumber,
    manufacturerPartNumber,
  }: {
    fetchPartCircuitJson: FetchPartCircuitJson
    supplierPartNumber?: string
    manufacturerPartNumber?: string
  },
  sourcePortOwner: NormalComponent,
) => {
  // Use the concrete class: Connector and Pinout inherit Chip but do not need
  // chip electrical metadata. Pass false to override engine-level enrichment.
  const includeDatasheetInformation =
    sourcePortOwner.config.componentName === "Chip" ||
    sourcePortOwner.config.componentName === "OpAmp"
  const request: DatasheetPartCircuitJsonRequest = {
    supplierPartNumber,
    manufacturerPartNumber,
    platformFetch: sourcePortOwner.root?.platform?.platformFetch,
    includeDatasheetInformation,
  }
  let partFetch: Promise<DatasheetPartFetchResult>
  const circuit = sourcePortOwner.root
  if (sourcePortOwner.config.componentName === "Chip" && circuit) {
    let partFetchesByEngine = chipDatasheetPartFetches.get(circuit)
    if (!partFetchesByEngine) {
      partFetchesByEngine = new WeakMap()
      chipDatasheetPartFetches.set(circuit, partFetchesByEngine)
    }
    let partFetches = partFetchesByEngine.get(fetchPartCircuitJson)
    if (!partFetches) {
      partFetches = new Map()
      partFetchesByEngine.set(fetchPartCircuitJson, partFetches)
    }
    // Both identifiers matter: different voltage variants can share a supplier
    // candidate while requesting different manufacturer part numbers.
    const partCacheKey: DatasheetPartCacheKey = `datasheet_part:${JSON.stringify(
      [supplierPartNumber, manufacturerPartNumber],
    )}`
    partFetch =
      partFetches.get(partCacheKey) ??
      fetchDatasheetPart(fetchPartCircuitJson, request)
    partFetches.set(partCacheKey, partFetch)
  } else {
    partFetch = fetchDatasheetPart(fetchPartCircuitJson, request)
  }
  const { circuitJson, datasheetFailureReason } = await partFetch
  // Cache the fetch outcome, not a component's diagnostics: each chip gets its
  // own warning and readable name even when it shares a fallback result.
  if (includeDatasheetInformation && datasheetFailureReason !== undefined) {
    const message = `Datasheet information for ${sourcePortOwner.getDisplayName()} could not be fetched: ${datasheetFailureReason}. Pin attributes may not be populated.`
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
  }
  return circuitJson
}
