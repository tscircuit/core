import * as circuitJsonUtil from "@tscircuit/circuit-json-util"
import type {
  PartsEngine,
  SupplierName,
  SupplierPartNumbers,
} from "@tscircuit/props"
import {
  type AnyCircuitElement,
  type PcbComponent,
  type PcbPin1Location,
  type SourcePort,
  type SupplierPin1LocationMap,
  type SupplierRotationOffsetMap,
  pcb_pin1_location,
  source_component_misconfigured_error,
} from "circuit-json"
import { fetchPartCircuitJsonWithoutDatasheet } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { isFootprintFlipped } from "lib/utils/pcb/transform-footprint-insertion-direction"
import { z } from "zod"
import type { NormalComponent } from "./NormalComponent"

const {
  analyzePcbPin1Location,
  getPcbFootprintOrientationPads,
  getPcbFootprintOrientationPadsFromCircuitJson,
  getPcbFootprintRotationOffset,
} = circuitJsonUtil

// Core supports older peer installs. Keep their pin-1 cache separate so a
// utility upgrade fetches supplier contact geometry on the next build.
const hasRotationMatcher = typeof getPcbFootprintRotationOffset === "function"
const orientationCacheVersion = hasRotationMatcher ? "v6" : "v5"

type SupplierPartCandidate = {
  supplierName: SupplierName
  supplierPartNumber: string
}

type Pin1Polarity = "anode" | "cathode"

type SupplierPartOrientationAnalysis = {
  pin1Location: PcbPin1Location | null
  pin1Polarity: Pin1Polarity | null
  orientationPads?: ReturnType<typeof getPcbFootprintOrientationPads>
}

// v6 also stores supplier contact geometry for comparison with authored pads.
type SupplierPartOrientationCacheKey =
  `part-orientation-analysis:${typeof orientationCacheVersion}:${SupplierName}:${string}`

const cachedSupplierOrientation = z.object({
  pin1_location: pcb_pin1_location.nullable(),
  pin1_polarity: z.enum(["anode", "cathode"]).nullable(),
  orientation_pads: z
    .array(
      z.object({
        type: z.enum(["pcb_smtpad", "pcb_plated_hole"]),
        center: z.object({ x: z.number().finite(), y: z.number().finite() }),
        labels: z.array(z.string()),
      }),
    )
    .nullish(),
})

const pendingSupplierPartOrientationAnalyses = new WeakMap<
  PartsEngine,
  Map<SupplierPartOrientationCacheKey, Promise<SupplierPartOrientationAnalysis>>
>()

const getPendingSupplierPartOrientationAnalyses = (
  partsEngine: PartsEngine,
) => {
  const existing = pendingSupplierPartOrientationAnalyses.get(partsEngine)
  if (existing) return existing

  const pendingAnalyses = new Map<
    SupplierPartOrientationCacheKey,
    Promise<SupplierPartOrientationAnalysis>
  >()
  pendingSupplierPartOrientationAnalyses.set(partsEngine, pendingAnalyses)
  return pendingAnalyses
}

const ANODE_HINTS = new Set(["a", "anode", "pos", "positive", "+"])
const CATHODE_HINTS = new Set(["c", "k", "cathode", "neg", "negative", "-"])

const normalizePolarityHint = (hint: string) =>
  hint.toLowerCase().replace(/[^a-z0-9+-]/g, "")

const getPin1SourcePort = (
  circuitJson: AnyCircuitElement[],
  sourceComponentId?: string,
): SourcePort | null => {
  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort =>
      element.type === "source_port" &&
      (!sourceComponentId || element.source_component_id === sourceComponentId),
  )

  return (
    sourcePorts.find((port) => port.pin_number === 1) ??
    sourcePorts.find((port) =>
      [port.name, ...(port.port_hints ?? [])]
        .map(normalizePolarityHint)
        .includes("pin1"),
    ) ??
    null
  )
}

const getPin1Polarity = (
  sourcePort: SourcePort | null,
): Pin1Polarity | null => {
  if (!sourcePort) return null

  const normalizedHints = [
    sourcePort.name,
    ...(sourcePort.port_hints ?? []),
  ].map(normalizePolarityHint)
  const hasAnodeHint = normalizedHints.some((hint) => ANODE_HINTS.has(hint))
  const hasCathodeHint = normalizedHints.some((hint) => CATHODE_HINTS.has(hint))

  if (hasAnodeHint === hasCathodeHint) return null
  return hasAnodeHint ? "anode" : "cathode"
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

const getSupplierPartOrientationCacheKey = ({
  supplierName,
  supplierPartNumber,
}: SupplierPartCandidate): SupplierPartOrientationCacheKey =>
  `part-orientation-analysis:${orientationCacheVersion}:${supplierName}:${supplierPartNumber}`

const readCachedSupplierPartOrientationAnalysis = async ({
  cacheKey,
  component,
}: {
  cacheKey: SupplierPartOrientationCacheKey
  component: NormalComponent<any, any>
}): Promise<
  | { cacheHit: true; analysis: SupplierPartOrientationAnalysis }
  | { cacheHit: false }
> => {
  const cachedValue =
    await component.root?.platform?.localCacheEngine?.getItem(cacheKey)
  if (!cachedValue) return { cacheHit: false }

  try {
    const cached = cachedSupplierOrientation.safeParse(JSON.parse(cachedValue))
    if (!cached.success) return { cacheHit: false }
    return {
      cacheHit: true,
      analysis: {
        pin1Location: cached.data.pin1_location,
        pin1Polarity: cached.data.pin1_polarity,
        orientationPads: cached.data.orientation_pads,
      },
    }
  } catch {
    return { cacheHit: false }
  }
}

const analyzeSupplierPartOrientation = async ({
  component,
  partsEngine,
  supplierPartCandidate,
}: {
  component: NormalComponent<any, any>
  partsEngine: PartsEngine
  supplierPartCandidate: SupplierPartCandidate
}): Promise<SupplierPartOrientationAnalysis> => {
  const cacheKey = getSupplierPartOrientationCacheKey(supplierPartCandidate)
  const cached = await readCachedSupplierPartOrientationAnalysis({
    cacheKey,
    component,
  })
  if (cached.cacheHit) return cached.analysis

  const pendingAnalyses = getPendingSupplierPartOrientationAnalyses(partsEngine)
  const existingAnalysis = pendingAnalyses.get(cacheKey)
  if (existingAnalysis) return existingAnalysis

  const analysis = (async () => {
    const supplierCircuitJson = await Promise.resolve(
      fetchPartCircuitJsonWithoutDatasheet(
        partsEngine.fetchPartCircuitJson!.bind(partsEngine),
        {
          supplierPartNumber: supplierPartCandidate.supplierPartNumber,
          platformFetch: component.root?.platform?.platformFetch,
        },
      ),
    )
    if (!supplierCircuitJson?.length) {
      return { pin1Location: null, pin1Polarity: null, orientationPads: null }
    }

    const pin1Location = analyzePcbPin1Location(supplierCircuitJson)
    const pin1Polarity = getPin1Polarity(getPin1SourcePort(supplierCircuitJson))
    const orientationPads = hasRotationMatcher
      ? getPcbFootprintOrientationPadsFromCircuitJson(supplierCircuitJson)
      : undefined
    try {
      await component.root?.platform?.localCacheEngine?.setItem(
        cacheKey,
        JSON.stringify({
          pin1_location: pin1Location,
          pin1_polarity: pin1Polarity,
          orientation_pads: orientationPads,
        } satisfies z.infer<typeof cachedSupplierOrientation>),
      )
    } catch {}
    return { pin1Location, pin1Polarity, orientationPads }
  })().finally(() => {
    pendingAnalyses.delete(cacheKey)
  })

  pendingAnalyses.set(cacheKey, analysis)
  return analysis
}

export const NormalComponent_doInitialPartOrientationAnalysis = (
  component: NormalComponent<any, any>,
) => {
  if (!component.root) return
  if (component.root.platform?.enablePartOrientationAnalysis === false) return
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
  ]
  if (pcbElements.length === 0) return
  const localPin1Location =
    getExplicitPcbPin1Location(component.resolveFootprint()) ??
    analyzePcbPin1Location(
      getUnrotatedLocalPcbElements({
        component,
        pcbComponent,
        pcbElements,
      }),
    )
  if (localPin1Location) {
    db.pcb_component.update(component.pcb_component_id, {
      pin1_location: localPin1Location,
    })
  }

  if (component.getInheritedProperty("bomDisabled")) return
  if (component.getInheritedProperty("partsEngineDisabled")) return
  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  if (!partsEngine?.fetchPartCircuitJson) return
  const sourceComponent = db.source_component.get(
    component.source_component_id!,
  )
  if (!sourceComponent) return
  const shouldCheckPin1Polarity =
    sourceComponent.ftype === "simple_diode" ||
    sourceComponent.ftype === "simple_led"
  const localPin1SourcePort = shouldCheckPin1Polarity
    ? getPin1SourcePort(
        db.source_port.list() as AnyCircuitElement[],
        component.source_component_id ?? undefined,
      )
    : null
  const localPin1Polarity = getPin1Polarity(localPin1SourcePort)
  const supplierPartCandidates = getSupplierPartCandidates(
    sourceComponent.supplier_part_numbers,
  )
  if (supplierPartCandidates.length === 0) return
  if (component._hasStartedPartOrientationAnalysis) return
  component._hasStartedPartOrientationAnalysis = true
  const authoredOrientationPads =
    hasRotationMatcher &&
    pcbComponent.layer === "top" &&
    component._getFootprintOriginalLayer() !== "bottom"
      ? getPcbFootprintOrientationPads(
          pcbElements,
          db.source_port.list({
            source_component_id: sourceComponent.source_component_id,
          }),
          db.pcb_port.list({ pcb_component_id: pcbComponent.pcb_component_id }),
          pcbComponent,
        )
      : null

  component._queueAsyncEffect("analyze-part-orientation", async () => {
    const supplierPin1LocationMap: SupplierPin1LocationMap = {}
    const supplierRotationOffsetMap: SupplierRotationOffsetMap = {}
    for (const supplierPartCandidate of supplierPartCandidates) {
      try {
        const {
          pin1Location: supplierPin1Location,
          pin1Polarity,
          orientationPads,
        } = await analyzeSupplierPartOrientation({
          component,
          partsEngine,
          supplierPartCandidate,
        })
        if (supplierPin1Location) {
          supplierPin1LocationMap[supplierPartCandidate.supplierName] =
            supplierPin1Location
        }
        if (authoredOrientationPads && orientationPads) {
          const offset = getPcbFootprintRotationOffset(
            authoredOrientationPads,
            orientationPads,
          )
          if (offset !== null)
            supplierRotationOffsetMap[supplierPartCandidate.supplierName] =
              offset
        }
        if (
          localPin1Polarity &&
          pin1Polarity &&
          localPin1Polarity !== pin1Polarity
        ) {
          const error = source_component_misconfigured_error.parse({
            type: "source_component_misconfigured_error",
            error_type: "source_component_misconfigured_error",
            message: `${component.getString()} maps pin 1 to the ${localPin1Polarity}, but supplier part ${supplierPartCandidate.supplierName}:${supplierPartCandidate.supplierPartNumber} maps pin 1 to the ${pin1Polarity}. Update pinLabels or use a supplier part with matching diode polarity.`,
            source_component_ids: [component.source_component_id!],
            source_port_ids: localPin1SourcePort?.source_port_id
              ? [localPin1SourcePort.source_port_id]
              : undefined,
          })
          component.root!.db.source_component_misconfigured_error.insert(error)
        }
      } catch {}
    }

    component._asyncSupplierPin1LocationMap = supplierPin1LocationMap
    component._asyncSupplierRotationOffsetMap = supplierRotationOffsetMap
    component._markDirty("PartOrientationAnalysis")
  })
}

export const NormalComponent_updatePartOrientationAnalysis = (
  component: NormalComponent<any, any>,
) => {
  const supplierPin1LocationMap = component._asyncSupplierPin1LocationMap
  const supplierRotationOffsetMap = component._asyncSupplierRotationOffsetMap
  if (
    (!supplierPin1LocationMap && !supplierRotationOffsetMap) ||
    !component.pcb_component_id
  )
    return

  const { db } = component.root!
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)
  if (!pcbComponent) return
  const update: Partial<PcbComponent> = {}
  if (supplierPin1LocationMap && Object.keys(supplierPin1LocationMap).length) {
    update.supplier_pin1_location_map = {
      ...pcbComponent.supplier_pin1_location_map,
      ...supplierPin1LocationMap,
    }
  }
  if (
    supplierRotationOffsetMap &&
    Object.keys(supplierRotationOffsetMap).length
  ) {
    update.supplier_rotation_offset_map = {
      ...pcbComponent.supplier_rotation_offset_map,
      ...supplierRotationOffsetMap,
    }
  }

  if (Object.keys(update).length)
    db.pcb_component.update(component.pcb_component_id, update)
}
