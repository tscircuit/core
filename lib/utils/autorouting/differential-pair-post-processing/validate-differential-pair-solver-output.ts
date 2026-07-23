import type {
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "../SimpleRouteJson"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

const valuesAreStructurallyEqual = (
  first: unknown,
  second: unknown,
): boolean => {
  if (Object.is(first, second)) return true
  if (Array.isArray(first) || Array.isArray(second)) {
    return (
      Array.isArray(first) &&
      Array.isArray(second) &&
      first.length === second.length &&
      first.every((value, valueIndex) =>
        valuesAreStructurallyEqual(value, second[valueIndex]),
      )
    )
  }
  if (
    !first ||
    !second ||
    typeof first !== "object" ||
    typeof second !== "object"
  ) {
    return false
  }

  const firstRecord = first as Record<string, unknown>
  const secondRecord = second as Record<string, unknown>
  const firstKeys = Object.keys(firstRecord)
  const secondKeys = Object.keys(secondRecord)
  return (
    firstKeys.length === secondKeys.length &&
    firstKeys.every(
      (key) =>
        Object.hasOwn(secondRecord, key) &&
        valuesAreStructurallyEqual(firstRecord[key], secondRecord[key]),
    )
  )
}

export const getSimplifiedPcbTraceConnectionName = (
  trace: SimplifiedPcbTrace,
): SrjConnectionName =>
  trace.connection_name ??
  (trace as SimplifiedPcbTrace & { source_trace_id?: string })
    .source_trace_id ??
  trace.pcb_trace_id

export const getDifferentialPairConnectionNames = (
  differentialPairs: readonly SimpleRouteDifferentialPair[],
): Set<SrjConnectionName> =>
  new Set(
    differentialPairs.flatMap(
      (differentialPair) => differentialPair.connectionNames,
    ),
  )

const getTraceWithoutRoute = (trace: SimplifiedPcbTrace) => {
  const { route: _route, ...traceWithoutRoute } = trace
  return traceWithoutRoute
}

function assertFiniteNumber(
  value: unknown,
  description: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${description} must be a finite number`)
  }
}

const validatePosition = (position: unknown, description: string): void => {
  if (!position || typeof position !== "object") {
    throw new Error(`${description} must be a position`)
  }
  const point = position as { x?: unknown; y?: unknown }
  assertFiniteNumber(point.x, `${description}.x`)
  assertFiniteNumber(point.y, `${description}.y`)
}

const validateLayer = (
  layer: unknown,
  availableLayers: ReadonlySet<string>,
  description: string,
): void => {
  if (typeof layer !== "string" || !availableLayers.has(layer)) {
    throw new Error(`${description} uses unavailable layer "${String(layer)}"`)
  }
}

const validatePositiveWidth = (width: unknown, description: string): void => {
  assertFiniteNumber(width, description)
  if (width <= 0) {
    throw new Error(`${description} must be greater than zero`)
  }
}

const validateRoute = ({
  trace,
  layerCount,
}: {
  trace: SimplifiedPcbTrace
  layerCount: number
}): void => {
  if (!Array.isArray(trace.route) || trace.route.length < 2) {
    throw new Error(
      `Differential-pair trace "${trace.pcb_trace_id}" must contain at least two route points`,
    )
  }

  const availableLayers = new Set<string>(["top"])
  for (
    let innerLayerIndex = 1;
    innerLayerIndex <= layerCount - 2;
    innerLayerIndex++
  ) {
    availableLayers.add(`inner${innerLayerIndex}`)
  }
  if (layerCount > 1) availableLayers.add("bottom")

  for (const [routePointIndex, routePoint] of trace.route.entries()) {
    const routePointDescription = `Trace "${trace.pcb_trace_id}" route point ${routePointIndex}`
    const point = routePoint as unknown as Record<string, unknown>

    if (point.route_type === "wire") {
      assertFiniteNumber(point.x, `${routePointDescription}.x`)
      assertFiniteNumber(point.y, `${routePointDescription}.y`)
      validatePositiveWidth(point.width, `${routePointDescription}.width`)
      validateLayer(
        point.layer,
        availableLayers,
        `${routePointDescription}.layer`,
      )
      continue
    }

    if (point.route_type === "via") {
      assertFiniteNumber(point.x, `${routePointDescription}.x`)
      assertFiniteNumber(point.y, `${routePointDescription}.y`)
      validateLayer(
        point.from_layer,
        availableLayers,
        `${routePointDescription}.from_layer`,
      )
      validateLayer(
        point.to_layer,
        availableLayers,
        `${routePointDescription}.to_layer`,
      )
      if (point.from_layer === point.to_layer) {
        throw new Error(
          `${routePointDescription} must transition between different layers`,
        )
      }
      for (const diameterField of [
        "via_diameter",
        "via_hole_diameter",
        "outer_diameter",
        "hole_diameter",
      ]) {
        if (point[diameterField] !== undefined) {
          validatePositiveWidth(
            point[diameterField],
            `${routePointDescription}.${diameterField}`,
          )
        }
      }
      continue
    }

    if (
      point.route_type === "through_obstacle" ||
      point.route_type === "through_pad"
    ) {
      validatePosition(point.start, `${routePointDescription}.start`)
      validatePosition(point.end, `${routePointDescription}.end`)
      validatePositiveWidth(point.width, `${routePointDescription}.width`)
      validateLayer(
        point.route_type === "through_pad"
          ? point.start_layer
          : point.from_layer,
        availableLayers,
        `${routePointDescription}.start_layer`,
      )
      validateLayer(
        point.route_type === "through_pad" ? point.end_layer : point.to_layer,
        availableLayers,
        `${routePointDescription}.end_layer`,
      )
      continue
    }

    if (point.route_type === "jumper") {
      validatePosition(point.start, `${routePointDescription}.start`)
      validatePosition(point.end, `${routePointDescription}.end`)
      validateLayer(
        point.layer,
        availableLayers,
        `${routePointDescription}.layer`,
      )
      continue
    }

    throw new Error(
      `${routePointDescription} has unsupported route_type "${String(point.route_type)}"`,
    )
  }
}

const getTracesByIdOrThrow = (
  traces: readonly SimplifiedPcbTrace[],
  label: string,
): Map<PcbTraceId, SimplifiedPcbTrace> => {
  const tracesById = new Map<PcbTraceId, SimplifiedPcbTrace>()
  for (const trace of traces) {
    if (tracesById.has(trace.pcb_trace_id)) {
      throw new Error(
        `${label} contains duplicate pcb_trace_id "${trace.pcb_trace_id}"`,
      )
    }
    tracesById.set(trace.pcb_trace_id, trace)
  }
  return tracesById
}

const assertPairMemberTraceCounts = ({
  traces,
  differentialPairConnectionNames,
  label,
}: {
  traces: readonly SimplifiedPcbTrace[]
  differentialPairConnectionNames: ReadonlySet<SrjConnectionName>
  label: string
}): void => {
  for (const connectionName of differentialPairConnectionNames) {
    const matchingTraceCount = traces.filter(
      (trace) => getSimplifiedPcbTraceConnectionName(trace) === connectionName,
    ).length
    if (matchingTraceCount !== 1) {
      throw new Error(
        `${label} must contain exactly one routed trace for differential-pair connection "${connectionName}", found ${matchingTraceCount}`,
      )
    }
  }
}

export const validateDifferentialPairSolverOutput = ({
  inputSimpleRouteJson,
  outputSimpleRouteJson,
  differentialPairs,
}: {
  inputSimpleRouteJson: SimpleRouteJson
  outputSimpleRouteJson: SimpleRouteJson
  differentialPairs: readonly SimpleRouteDifferentialPair[]
}): void => {
  if (
    !valuesAreStructurallyEqual(
      inputSimpleRouteJson.differentialPairs,
      differentialPairs,
    )
  ) {
    throw new Error(
      "Input Simple Route JSON differentialPairs conflicts with the explicit DifferentialPairSolver constraints",
    )
  }
  if (
    !valuesAreStructurallyEqual(
      outputSimpleRouteJson.differentialPairs,
      differentialPairs,
    )
  ) {
    throw new Error(
      "Output Simple Route JSON differentialPairs conflicts with the explicit DifferentialPairSolver constraints",
    )
  }

  const { traces: inputTraces = [], ...inputWithoutTraces } =
    inputSimpleRouteJson
  const { traces: outputTraces = [], ...outputWithoutTraces } =
    outputSimpleRouteJson
  if (!valuesAreStructurallyEqual(inputWithoutTraces, outputWithoutTraces)) {
    throw new Error(
      "DifferentialPairSolver changed non-trace Simple Route JSON data",
    )
  }
  if (inputTraces.length !== outputTraces.length) {
    throw new Error(
      `DifferentialPairSolver changed the routed trace count from ${inputTraces.length} to ${outputTraces.length}`,
    )
  }

  const differentialPairConnectionNames =
    getDifferentialPairConnectionNames(differentialPairs)
  assertPairMemberTraceCounts({
    traces: inputTraces,
    differentialPairConnectionNames,
    label: "Input Simple Route JSON",
  })
  assertPairMemberTraceCounts({
    traces: outputTraces,
    differentialPairConnectionNames,
    label: "Output Simple Route JSON",
  })

  const inputTracesById = getTracesByIdOrThrow(inputTraces, "Solver input")
  const outputTracesById = getTracesByIdOrThrow(outputTraces, "Solver output")

  for (const inputTrace of inputTraces) {
    const outputTrace = outputTracesById.get(inputTrace.pcb_trace_id)
    if (!outputTrace) {
      throw new Error(
        `DifferentialPairSolver removed pcb_trace "${inputTrace.pcb_trace_id}"`,
      )
    }

    const inputConnectionName = getSimplifiedPcbTraceConnectionName(inputTrace)
    const outputConnectionName =
      getSimplifiedPcbTraceConnectionName(outputTrace)
    if (inputConnectionName !== outputConnectionName) {
      throw new Error(
        `DifferentialPairSolver changed pcb_trace "${inputTrace.pcb_trace_id}" connection identity from "${inputConnectionName}" to "${outputConnectionName}"`,
      )
    }

    const isDifferentialPairTrace =
      differentialPairConnectionNames.has(inputConnectionName)
    if (
      !isDifferentialPairTrace &&
      !valuesAreStructurallyEqual(inputTrace, outputTrace)
    ) {
      throw new Error(
        `DifferentialPairSolver changed non-pair trace "${inputTrace.pcb_trace_id}"`,
      )
    }
    if (
      isDifferentialPairTrace &&
      !valuesAreStructurallyEqual(
        getTraceWithoutRoute(inputTrace),
        getTraceWithoutRoute(outputTrace),
      )
    ) {
      throw new Error(
        `DifferentialPairSolver changed identity metadata for pair trace "${inputTrace.pcb_trace_id}"`,
      )
    }
    if (
      isDifferentialPairTrace &&
      (!valuesAreStructurallyEqual(inputTrace.route[0], outputTrace.route[0]) ||
        !valuesAreStructurallyEqual(
          inputTrace.route[inputTrace.route.length - 1],
          outputTrace.route[outputTrace.route.length - 1],
        ))
    ) {
      throw new Error(
        `DifferentialPairSolver changed endpoints for pair trace "${inputTrace.pcb_trace_id}"`,
      )
    }

    validateRoute({
      trace: outputTrace,
      layerCount: outputSimpleRouteJson.layerCount,
    })
  }

  for (const outputTraceId of outputTracesById.keys()) {
    if (!inputTracesById.has(outputTraceId)) {
      throw new Error(
        `DifferentialPairSolver added unexpected pcb_trace "${outputTraceId}"`,
      )
    }
  }
}

export const differentialPairSolverOutputChangesRoutes = ({
  inputSimpleRouteJson,
  outputSimpleRouteJson,
  differentialPairs,
}: {
  inputSimpleRouteJson: SimpleRouteJson
  outputSimpleRouteJson: SimpleRouteJson
  differentialPairs: readonly SimpleRouteDifferentialPair[]
}): boolean => {
  const differentialPairConnectionNames =
    getDifferentialPairConnectionNames(differentialPairs)
  const outputTracesById = getTracesByIdOrThrow(
    outputSimpleRouteJson.traces ?? [],
    "Solver output",
  )

  return (inputSimpleRouteJson.traces ?? []).some((inputTrace) => {
    if (
      !differentialPairConnectionNames.has(
        getSimplifiedPcbTraceConnectionName(inputTrace),
      )
    ) {
      return false
    }
    return !valuesAreStructurallyEqual(
      inputTrace.route,
      outputTracesById.get(inputTrace.pcb_trace_id)?.route,
    )
  })
}
