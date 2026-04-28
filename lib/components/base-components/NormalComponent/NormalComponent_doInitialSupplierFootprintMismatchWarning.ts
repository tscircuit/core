import { getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import type { PartsEngine, SupplierPartNumbers } from "@tscircuit/props"
import {
  type AnyCircuitElement,
  type SupplierName,
  supplier_footprint_mismatch_warning,
  unknown_error_finding_part,
} from "circuit-json"
import type { NormalComponent } from "./NormalComponent"
import type { Bounds } from "@tscircuit/math-utils"

const SUPPLIER_FOOTPRINT_IOU_WARNING_THRESHOLD = 0.8

type SupplierPartCandidate = {
  supplierName: SupplierName
  supplierPartNumber: string
}

const supplierNames: SupplierName[] = [
  "jlcpcb",
  "macrofab",
  "pcbway",
  "digikey",
  "mouser",
  "lcsc",
]

const isCopperElement = (elm: AnyCircuitElement) =>
  elm.type === "pcb_smtpad" || elm.type === "pcb_plated_hole"

const isValidBounds = (bounds: Bounds) =>
  Number.isFinite(bounds.minX) &&
  Number.isFinite(bounds.minY) &&
  Number.isFinite(bounds.maxX) &&
  Number.isFinite(bounds.maxY) &&
  bounds.maxX > bounds.minX &&
  bounds.maxY > bounds.minY

const getCopperBounds = (elements: AnyCircuitElement[]): Bounds | null => {
  const copperElements = elements.filter(isCopperElement)
  if (copperElements.length === 0) return null

  const bounds = getBoundsOfPcbElements(copperElements)
  if (!isValidBounds(bounds)) return null
  return bounds
}

const getBoundsSize = (bounds: Bounds) => ({
  width: bounds.maxX - bounds.minX,
  height: bounds.maxY - bounds.minY,
})

const getCenteredBoundsIou = (
  boundsA: Bounds,
  boundsB: Bounds,
  opts?: { rotateB?: boolean },
) => {
  const sizeA = getBoundsSize(boundsA)
  const sizeB = getBoundsSize(boundsB)
  const bWidth = opts?.rotateB ? sizeB.height : sizeB.width
  const bHeight = opts?.rotateB ? sizeB.width : sizeB.height

  const intersectionWidth = Math.min(sizeA.width, bWidth)
  const intersectionHeight = Math.min(sizeA.height, bHeight)
  const intersectionArea = intersectionWidth * intersectionHeight
  const unionArea =
    sizeA.width * sizeA.height + bWidth * bHeight - intersectionArea

  if (unionArea <= 0) return 0
  return intersectionArea / unionArea
}

const getBestBoundsIou = (localBounds: Bounds, supplierBounds: Bounds) =>
  Math.max(
    getCenteredBoundsIou(localBounds, supplierBounds),
    getCenteredBoundsIou(localBounds, supplierBounds, { rotateB: true }),
  )

const getSupplierPartCandidates = (
  supplierPartNumbers?: SupplierPartNumbers,
): SupplierPartCandidate[] => {
  if (!supplierPartNumbers) return []

  const candidates: SupplierPartCandidate[] = []
  for (const supplierName of supplierNames) {
    const partNumbers = supplierPartNumbers[supplierName]
    if (!Array.isArray(partNumbers)) continue

    for (const supplierPartNumber of partNumbers) {
      if (!supplierPartNumber) continue
      candidates.push({ supplierName, supplierPartNumber })
    }
  }

  return candidates
}

export function NormalComponent_doInitialSupplierFootprintMismatchWarning(
  component: NormalComponent<any, any>,
  queueAsyncEffect: (name: string, effect: () => Promise<void>) => void,
) {
  if (component.root?.pcbDisabled) return
  if (component.props.doNotPlace) return
  if (component.props.footprint === undefined) return
  if (component.getInheritedProperty("bomDisabled")) return
  if (component.getInheritedProperty("partsEngineDisabled")) return

  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  if (!partsEngine?.fetchPartCircuitJson) return

  const { db } = component.root!
  const sourceComponent = db.source_component.get(
    component.source_component_id!,
  )
  if (!sourceComponent?.supplier_part_numbers) return
  if (!component.pcb_component_id) return
  if (component._hasStartedSupplierFootprintMismatchWarningCheck) return

  const supplierPartCandidates = getSupplierPartCandidates(
    sourceComponent.supplier_part_numbers,
  )
  if (supplierPartCandidates.length === 0) return

  const localCopperElements = [
    ...db.pcb_smtpad.list({ pcb_component_id: component.pcb_component_id }),
    ...db.pcb_plated_hole.list({
      pcb_component_id: component.pcb_component_id,
    }),
  ] as AnyCircuitElement[]
  const localBounds = getCopperBounds(localCopperElements)
  if (!localBounds) return

  component._hasStartedSupplierFootprintMismatchWarningCheck = true

  queueAsyncEffect("check-supplier-footprint-mismatch", async () => {
    const { db } = component.root!
    const fetchPartCircuitJson = partsEngine.fetchPartCircuitJson!

    for (const supplierPartCandidate of supplierPartCandidates) {
      const { supplierName, supplierPartNumber } = supplierPartCandidate
      try {
        const supplierCircuitJson =
          (await Promise.resolve(
            fetchPartCircuitJson({ supplierPartNumber }),
          )) ?? null
        if (!supplierCircuitJson?.length) continue

        const supplierBounds = getCopperBounds(supplierCircuitJson)
        if (!supplierBounds) continue

        const footprintCopperIou = getBestBoundsIou(localBounds, supplierBounds)
        if (footprintCopperIou >= SUPPLIER_FOOTPRINT_IOU_WARNING_THRESHOLD) {
          return
        }

        const footprintLabel =
          typeof component.props.footprint === "string"
            ? `"${component.props.footprint}"`
            : "the provided footprint"
        const roundedIou = Number(footprintCopperIou.toFixed(4))
        const warning = supplier_footprint_mismatch_warning.parse({
          type: "supplier_footprint_mismatch_warning",
          message: `${component.getString()} footprint ${footprintLabel} does not match supplier footprint ${supplierName}:${supplierPartNumber} (copper IoU ${roundedIou}).`,
          source_component_id: component.source_component_id!,
          pcb_component_id: component.pcb_component_id,
          pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
          subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
          supplier_name: supplierName,
          supplier_part_number: supplierPartNumber,
          footprint_copper_intersection_over_union: roundedIou,
        })

        db.supplier_footprint_mismatch_warning.insert(warning)
        return
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        const errorObj = unknown_error_finding_part.parse({
          type: "unknown_error_finding_part",
          message: `Failed to fetch supplier footprint for ${component.getString()} (${supplierName}:${supplierPartNumber}): ${errorMessage}`,
          source_component_id: component.source_component_id,
          subcircuit_id: component.getSubcircuit()?.subcircuit_id,
        })
        db.unknown_error_finding_part.insert(errorObj)
        return
      }
    }
  })
}
