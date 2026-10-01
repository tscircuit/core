import * as Cause from "effect/Cause"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { corePromise, coreSync, type CoreError } from "lib/effect/core-error"
import type { CoreJobContext } from "lib/effect/core-services"
import { readLocalCacheEffect } from "lib/local-cache-engine"
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
  type SourcePort,
  type SupplierPin1LocationMap,
  pcb_pin1_location,
  source_component_misconfigured_error,
} from "circuit-json"
import { isFootprintFlipped } from "lib/utils/pcb/transform-footprint-insertion-direction"
import type { NormalComponent } from "./NormalComponent"

type SupplierPartCandidate = {
  supplierName: SupplierName
  supplierPartNumber: string
}

type Pin1Polarity = "anode" | "cathode"

type SupplierPartOrientationAnalysis = {
  pin1Location: PcbPin1Location | null
  pin1Polarity: Pin1Polarity | null
}

// v4 invalidates null straight-row frames cached before circuit-json-util 0.0.117.
type SupplierPartOrientationCacheKey =
  `part-orientation-analysis:v4:${SupplierName}:${string}`

type CachedSupplierPartOrientationAnalysis = {
  pin1_location: PcbPin1Location | null
  pin1_polarity: Pin1Polarity | null
}

class OrientationProducerCancelled extends Error {}

const pendingSupplierPartOrientationAnalyses = new WeakMap<
  PartsEngine,
  Map<
    SupplierPartOrientationCacheKey,
    Deferred.Deferred<
      SupplierPartOrientationAnalysis,
      CoreError | OrientationProducerCancelled
    >
  >
>()

const getPendingSupplierPartOrientationAnalyses = (
  partsEngine: PartsEngine,
) => {
  const existing = pendingSupplierPartOrientationAnalyses.get(partsEngine)
  if (existing) return existing

  const pendingAnalyses = new Map<
    SupplierPartOrientationCacheKey,
    Deferred.Deferred<
      SupplierPartOrientationAnalysis,
      CoreError | OrientationProducerCancelled
    >
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
  `part-orientation-analysis:v4:${supplierName}:${supplierPartNumber}`

const readCachedSupplierPartOrientationAnalysis = ({
  cacheKey,
  component,
}: {
  cacheKey: SupplierPartOrientationCacheKey
  component: NormalComponent<any, any>
}) =>
  Effect.gen(function* () {
    const cacheEngine = component.root?.platform?.localCacheEngine
    // The original async helper awaited optional getItem even without an engine.
    const cachedValue = yield* cacheEngine
      ? readLocalCacheEffect({ cacheKey, cacheEngine })
      : corePromise(
          () => Promise.resolve(null),
          "read_optional_orientation_cache",
        )
    if (!cachedValue) return { cacheHit: false as const }
    return yield* coreSync(() => {
      try {
        const cached = JSON.parse(
          cachedValue,
        ) as CachedSupplierPartOrientationAnalysis
        const pin1LocationResult = pcb_pin1_location.safeParse(
          cached.pin1_location,
        )
        const pin1Location =
          cached.pin1_location === null
            ? null
            : pin1LocationResult.success
              ? pin1LocationResult.data
              : undefined
        const pin1Polarity =
          cached.pin1_polarity === null ||
          cached.pin1_polarity === "anode" ||
          cached.pin1_polarity === "cathode"
            ? cached.pin1_polarity
            : undefined
        if (pin1Location === undefined || pin1Polarity === undefined)
          return { cacheHit: false as const }
        return {
          cacheHit: true as const,
          analysis: { pin1Location, pin1Polarity },
        }
      } catch {
        return { cacheHit: false as const }
      }
    }, "decode_orientation_cache")
  })

type SupplierOrientationRequest = {
  component: NormalComponent<any, any>
  partsEngine: PartsEngine
  supplierPartCandidate: SupplierPartCandidate
  job: CoreJobContext
}

const analyzeSupplierPartOrientation = (
  request: SupplierOrientationRequest,
): Effect.Effect<
  SupplierPartOrientationAnalysis,
  CoreError | OrientationProducerCancelled
> =>
  Effect.gen(function* () {
    const { component, partsEngine, supplierPartCandidate, job } = request
    const cacheKey = getSupplierPartOrientationCacheKey(supplierPartCandidate)
    const cached = yield* readCachedSupplierPartOrientationAnalysis({
      cacheKey,
      component,
    })
    // Preserve the caller's await of the formerly async cache helper too.
    yield* corePromise(
      () => Promise.resolve(),
      "await_orientation_cache_result",
    )
    if (cached.cacheHit) return cached.analysis
    const pendingAnalyses =
      getPendingSupplierPartOrientationAnalyses(partsEngine)
    const existing = pendingAnalyses.get(cacheKey)
    if (existing) {
      // A live subscriber takes over if the producer's component was removed.
      // Its cancellation never interrupts the producer or other subscribers.
      return yield* Deferred.await(existing).pipe(
        Effect.catch((error) =>
          error instanceof OrientationProducerCancelled
            ? analyzeSupplierPartOrientation(request)
            : Effect.fail(error),
        ),
      )
    }
    const pending = yield* Deferred.make<
      SupplierPartOrientationAnalysis,
      CoreError | OrientationProducerCancelled
    >()
    pendingAnalyses.set(cacheKey, pending)
    return yield* Effect.gen(function* () {
      const supplierCircuitJson = yield* corePromise(
        () =>
          Promise.resolve(
            partsEngine.fetchPartCircuitJson!({
              supplierPartNumber: supplierPartCandidate.supplierPartNumber,
              // This callback retains the original platform function identity.
              platformFetch: component.root?.platform?.platformFetch,
            }),
          ),
        "fetch_orientation_footprint",
      )
      if (!supplierCircuitJson?.length)
        return { pin1Location: null, pin1Polarity: null }
      const analysis = yield* coreSync(
        () => ({
          pin1Location: analyzePcbPin1Location(supplierCircuitJson),
          pin1Polarity: getPin1Polarity(getPin1SourcePort(supplierCircuitJson)),
        }),
        "analyze_supplier_orientation",
      )
      const cacheEngine = component.root?.platform?.localCacheEngine
      if (cacheEngine) {
        yield* corePromise(
          () =>
            Promise.resolve(
              job.commit(() =>
                cacheEngine.setItem(
                  cacheKey,
                  JSON.stringify({
                    pin1_location: analysis.pin1Location,
                    pin1_polarity: analysis.pin1Polarity,
                  } satisfies CachedSupplierPartOrientationAnalysis),
                ),
              ),
            ),
          "cache_supplier_orientation",
        ).pipe(Effect.catch(() => Effect.void))
      }
      return analysis
    }).pipe(
      Effect.onExit((exit) =>
        Effect.gen(function* () {
          if (pendingAnalyses.get(cacheKey) === pending)
            pendingAnalyses.delete(cacheKey)
          yield* Deferred.done(
            pending,
            Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)
              ? Exit.fail(new OrientationProducerCancelled())
              : exit,
          )
        }),
      ),
    )
  })

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
  ] as AnyCircuitElement[]
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
  const shouldCheckPin1Polarity =
    sourceComponent?.ftype === "simple_diode" ||
    sourceComponent?.ftype === "simple_led"
  const localPin1SourcePort = shouldCheckPin1Polarity
    ? getPin1SourcePort(
        db.source_port.list() as AnyCircuitElement[],
        component.source_component_id ?? undefined,
      )
    : null
  const localPin1Polarity = getPin1Polarity(localPin1SourcePort)
  const supplierPartCandidates = getSupplierPartCandidates(
    sourceComponent?.supplier_part_numbers,
  )
  if (supplierPartCandidates.length === 0) return
  if (component._hasStartedPartOrientationAnalysis) return
  component._hasStartedPartOrientationAnalysis = true

  component._queueEffect("analyze-part-orientation", (job) =>
    Effect.gen(function* () {
      const supplierPin1LocationMap: SupplierPin1LocationMap = {}
      for (const supplierPartCandidate of supplierPartCandidates) {
        yield* Effect.gen(function* () {
          const { pin1Location: supplierPin1Location, pin1Polarity } =
            yield* analyzeSupplierPartOrientation({
              component,
              partsEngine,
              supplierPartCandidate,
              job,
            })
          if (supplierPin1Location)
            supplierPin1LocationMap[supplierPartCandidate.supplierName] =
              supplierPin1Location
          if (
            localPin1Polarity &&
            pin1Polarity &&
            localPin1Polarity !== pin1Polarity
          ) {
            yield* coreSync(
              () =>
                job.commit(() => {
                  const error = source_component_misconfigured_error.parse({
                    type: "source_component_misconfigured_error",
                    error_type: "source_component_misconfigured_error",
                    message: `${component.getString()} maps pin 1 to the ${localPin1Polarity}, but supplier part ${supplierPartCandidate.supplierName}:${supplierPartCandidate.supplierPartNumber} maps pin 1 to the ${pin1Polarity}. Update pinLabels or use a supplier part with matching diode polarity.`,
                    source_component_ids: [component.source_component_id!],
                    source_port_ids: localPin1SourcePort?.source_port_id
                      ? [localPin1SourcePort.source_port_id]
                      : undefined,
                  })
                  db.source_component_misconfigured_error.insert(error)
                }),
              "commit_supplier_polarity_error",
            )
          }
        }).pipe(Effect.catch(() => Effect.void))
      }
      yield* coreSync(
        () =>
          job.commit(() => {
            component._asyncSupplierPin1LocationMap = supplierPin1LocationMap
            component._markDirty("PartOrientationAnalysis")
          }),
        "commit_supplier_orientation",
      )
    }),
  )
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
