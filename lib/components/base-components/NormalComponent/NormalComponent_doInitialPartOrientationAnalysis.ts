import { analyzePcbPin1Location } from "@tscircuit/circuit-json-util"
import type {
  PartsEngine,
  SupplierName,
  SupplierPartNumbers,
} from "@tscircuit/props"
import {
  type AnyCircuitElement,
  type PcbComponent,
  type PcbPin1Location,
  type SupplierPin1LocationMap,
  pcb_pin1_location,
} from "circuit-json"
import { isFootprintFlipped } from "lib/utils/pcb/transform-footprint-insertion-direction"
import type { NormalComponent } from "./NormalComponent"

type SupplierPartCandidate = {
  supplierName: SupplierName
  supplierPartNumber: string
}

type SupplierPin1LocationCacheKey =
  `part-orientation-analysis:v1:${SupplierName}:${string}`

type CachedSupplierPin1Location = {
  pin1_location: PcbPin1Location | null
}

const pendingSupplierPin1LocationAnalyses = new WeakMap<
  PartsEngine,
  Map<SupplierPin1LocationCacheKey, Promise<PcbPin1Location | null>>
>()

const getPendingSupplierPin1LocationAnalyses = (partsEngine: PartsEngine) => {
  const existing = pendingSupplierPin1LocationAnalyses.get(partsEngine)
  if (existing) return existing

  const pendingAnalyses = new Map<
    SupplierPin1LocationCacheKey,
    Promise<PcbPin1Location | null>
  >()
  pendingSupplierPin1LocationAnalyses.set(partsEngine, pendingAnalyses)
  return pendingAnalyses
}

const getSupplierPartCandidates = (
  supplierPartNumbers?: SupplierPartNumbers,
): SupplierPartCandidate[] => {
  if (!supplierPartNumbers) return []

  const candidates: SupplierPartCandidate[] = []
  for (const supplierName of Object.keys(
    supplierPartNumbers,
  ) as SupplierName[]) {
    const supplierPartNumber = supplierPartNumbers[supplierName]?.[0]
    if (supplierPartNumber) {
      candidates.push({ supplierName, supplierPartNumber })
    }
  }
  return candidates
}

const getExplicitPcbPin1Location = (
  footprint: unknown,
): PcbPin1Location | null => {
  if (typeof footprint !== "string") return null
  const match = footprint.match(
    /(?:^|_)pin1location\((leftside|rightside|topside|bottomside),(left|right|top|bottom)\)(?:_|$)/i,
  )
  if (!match) return null

  const result = pcb_pin1_location.safeParse(
    `${match[1]!.toLowerCase()}_${match[2]!.toLowerCase()}`,
  )
  return result.success ? result.data : null
}

const getUnrotatedLocalPcbElements = ({
  component,
  pcbComponent,
  pcbElements,
}: {
  component: NormalComponent<any, any>
  pcbComponent: PcbComponent
  pcbElements: AnyCircuitElement[]
}): AnyCircuitElement[] => {
  const rotationRadians = (-pcbComponent.rotation * Math.PI) / 180
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)
  const isFlipped = isFootprintFlipped({
    componentLayer: pcbComponent.layer,
    originalLayer: component._getFootprintOriginalLayer(),
  })
  const toLocalPoint = (point: { x: number; y: number }) => {
    const x = point.x - pcbComponent.center.x
    const placedY = point.y - pcbComponent.center.y
    const y = isFlipped ? -placedY : placedY
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos,
    }
  }

  return pcbElements.map((pcbElement) => {
    const localElement = structuredClone(pcbElement) as AnyCircuitElement & {
      x?: number
      y?: number
      points?: Array<{ x: number; y: number }>
    }
    if (
      typeof localElement.x === "number" &&
      typeof localElement.y === "number"
    ) {
      const localCenter = toLocalPoint(localElement as { x: number; y: number })
      localElement.x = localCenter.x
      localElement.y = localCenter.y
    }
    if (localElement.points) {
      localElement.points = localElement.points.map(toLocalPoint)
    }
    return localElement
  })
}

const getSupplierPin1LocationCacheKey = ({
  supplierName,
  supplierPartNumber,
}: SupplierPartCandidate): SupplierPin1LocationCacheKey =>
  `part-orientation-analysis:v1:${supplierName}:${supplierPartNumber}`

const readCachedSupplierPin1Location = async ({
  cacheKey,
  component,
}: {
  cacheKey: SupplierPin1LocationCacheKey
  component: NormalComponent<any, any>
}): Promise<
  { cacheHit: true; pin1Location: PcbPin1Location | null } | { cacheHit: false }
> => {
  const cachedValue =
    await component.root?.platform?.localCacheEngine?.getItem(cacheKey)
  if (!cachedValue) return { cacheHit: false }

  try {
    const cached = JSON.parse(cachedValue) as CachedSupplierPin1Location
    if (cached.pin1_location === null) {
      return { cacheHit: true, pin1Location: null }
    }
    const result = pcb_pin1_location.safeParse(cached.pin1_location)
    return result.success
      ? { cacheHit: true, pin1Location: result.data }
      : { cacheHit: false }
  } catch {
    return { cacheHit: false }
  }
}

const analyzeSupplierPin1Location = async ({
  component,
  partsEngine,
  supplierPartCandidate,
}: {
  component: NormalComponent<any, any>
  partsEngine: PartsEngine
  supplierPartCandidate: SupplierPartCandidate
}): Promise<PcbPin1Location | null> => {
  const cacheKey = getSupplierPin1LocationCacheKey(supplierPartCandidate)
  const cached = await readCachedSupplierPin1Location({ cacheKey, component })
  if (cached.cacheHit) return cached.pin1Location

  const pendingAnalyses = getPendingSupplierPin1LocationAnalyses(partsEngine)
  const existingAnalysis = pendingAnalyses.get(cacheKey)
  if (existingAnalysis) return existingAnalysis

  const analysis = (async () => {
    const supplierCircuitJson = await Promise.resolve(
      partsEngine.fetchPartCircuitJson!({
        supplierPartNumber: supplierPartCandidate.supplierPartNumber,
        platformFetch: component.root?.platform?.platformFetch,
      }),
    )
    if (!supplierCircuitJson?.length) return null

    const pin1Location = analyzePcbPin1Location(supplierCircuitJson)
    try {
      await component.root?.platform?.localCacheEngine?.setItem(
        cacheKey,
        JSON.stringify({ pin1_location: pin1Location }),
      )
    } catch {}
    return pin1Location
  })().finally(() => {
    pendingAnalyses.delete(cacheKey)
  })

  pendingAnalyses.set(cacheKey, analysis)
  return analysis
}

export const NormalComponent_doInitialPartOrientationAnalysis = (
  component: NormalComponent<any, any>,
) => {
  if (!component.root?.platform?.enablePartOrientationAnalysis) return
  if (component.root.pcbDisabled || component.props.doNotPlace) return
  if (!component.pcb_component_id) return

  const { db } = component.root
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)
  if (!pcbComponent) return

  const pcbElements = [
    ...db.pcb_smtpad.list({ pcb_component_id: component.pcb_component_id }),
    ...db.pcb_plated_hole.list({
      pcb_component_id: component.pcb_component_id,
    }),
  ] as AnyCircuitElement[]
  const localPin1Location =
    getExplicitPcbPin1Location(component.resolveFootprint()) ??
    analyzePcbPin1Location(
      getUnrotatedLocalPcbElements({
        component,
        pcbComponent,
        pcbElements,
      }),
    )
  if (!localPin1Location) return

  db.pcb_component.update(component.pcb_component_id, {
    pin1_location: localPin1Location,
  })

  if (component.getInheritedProperty("bomDisabled")) return
  if (component.getInheritedProperty("partsEngineDisabled")) return
  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  if (!partsEngine?.fetchPartCircuitJson) return
  const sourceComponent = db.source_component.get(
    component.source_component_id!,
  )
  const supplierPartCandidates = getSupplierPartCandidates(
    sourceComponent?.supplier_part_numbers,
  )
  if (supplierPartCandidates.length === 0) return
  if (component._hasStartedPartOrientationAnalysis) return
  component._hasStartedPartOrientationAnalysis = true

  component._queueAsyncEffect("analyze-part-orientation", async () => {
    const supplierPin1LocationMap: SupplierPin1LocationMap = {}
    for (const supplierPartCandidate of supplierPartCandidates) {
      try {
        const supplierPin1Location = await analyzeSupplierPin1Location({
          component,
          partsEngine,
          supplierPartCandidate,
        })
        if (supplierPin1Location) {
          supplierPin1LocationMap[supplierPartCandidate.supplierName] =
            supplierPin1Location
        }
      } catch {}
    }

    component._asyncSupplierPin1LocationMap = supplierPin1LocationMap
    component._markDirty("PartOrientationAnalysis")
  })
}

export const NormalComponent_updatePartOrientationAnalysis = (
  component: NormalComponent<any, any>,
) => {
  const supplierPin1LocationMap = component._asyncSupplierPin1LocationMap
  if (!supplierPin1LocationMap || !component.pcb_component_id) return

  const { db } = component.root!
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)
  if (!pcbComponent || Object.keys(supplierPin1LocationMap).length === 0) return

  db.pcb_component.update(component.pcb_component_id, {
    supplier_pin1_location_map: {
      ...pcbComponent.supplier_pin1_location_map,
      ...supplierPin1LocationMap,
    },
  })
}
