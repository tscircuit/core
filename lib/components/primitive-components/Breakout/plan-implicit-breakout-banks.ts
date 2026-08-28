import type {
  ImplicitBreakoutBus,
  ImplicitBreakoutBounds,
  ImplicitBreakoutEdge,
  ImplicitBreakoutPointSolverInput,
  ImplicitBreakoutPointSolverOutput,
  ImplicitBreakoutRegion,
} from "@tscircuit/props"

type ConnectionId = ImplicitBreakoutBus["connectionIds"][number]

export interface ImplicitBreakoutBankObstacle {
  readonly id: string
  readonly bounds: ImplicitBreakoutBounds
}

export interface ImplicitBreakoutBankPlanningContext {
  readonly boardBounds: ImplicitBreakoutBounds
  readonly obstacles?: readonly ImplicitBreakoutBankObstacle[]
  readonly maximumCandidateBanksPerBus?: number
  readonly maximumJointStates?: number
}

export interface ImplicitBreakoutBankPointProvenance {
  readonly regionId: string
  readonly connectionId: ConnectionId
  readonly busId: ImplicitBreakoutBus["busId"]
  readonly selectedLayer: string
  readonly rank: number
  readonly side: ImplicitBreakoutEdge
  readonly tangentPitch: number
  readonly tangentShift: number
  readonly normalOffset: number
  readonly virtual: boolean
}

export interface ImplicitBreakoutBankAssignment {
  readonly busId: ImplicitBreakoutBus["busId"]
  readonly selectedLayer: string
  readonly connectionIdsInWindingOrder: readonly ConnectionId[]
  readonly tangentPitch: number
  readonly tangentShift: number
  readonly normalOffset: number
  readonly sideByRegionId: Readonly<Record<string, ImplicitBreakoutEdge>>
}

export interface PlannedImplicitBreakoutPointSolverOutput
  extends ImplicitBreakoutPointSolverOutput {
  readonly bankPlan: {
    readonly minimumLanePitch: number
    readonly desiredLanePitch: number
    readonly assignments: readonly ImplicitBreakoutBankAssignment[]
    readonly pointProvenance: readonly ImplicitBreakoutBankPointProvenance[]
    readonly virtualPointKeys: readonly string[]
  }
}

interface BankCandidate {
  readonly busId: ImplicitBreakoutBus["busId"]
  readonly selectedLayer: string
  readonly connectionIdsInWindingOrder: readonly ConnectionId[]
  readonly points: readonly ImplicitBreakoutBankPointProvenance[]
  readonly breakoutPoints: ImplicitBreakoutPointSolverOutput["breakoutPoints"]
  readonly sideRank: number
  readonly tangentPitch: number
  readonly tangentShift: number
  readonly normalOffset: number
  readonly sideByRegionId: Readonly<Record<string, ImplicitBreakoutEdge>>
  readonly key: string
}

interface JointState {
  readonly candidates: readonly BankCandidate[]
  readonly maximumSideRank: number
  readonly sideRankSum: number
  readonly minimumPitch: number
  readonly totalShift: number
  readonly totalNormalOffset: number
  readonly key: string
}

const EPSILON = 1e-9
const DEFAULT_MAXIMUM_CANDIDATE_BANKS_PER_BUS = 384
const DEFAULT_MAXIMUM_JOINT_STATES = 512
const PITCH_MULTIPLIERS = [2, 1.875, 1.75, 1.625, 1.5, 1.375, 1.25, 1.125, 1]
const SHIFT_MULTIPLIERS = [0, -1, 1, -2, 2, -4, 4, -6, 6]
const NORMAL_OFFSET_MULTIPLIERS = [0, 1, 2, 3, 4, 6]

export class ImplicitBreakoutBankInfeasibleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImplicitBreakoutBankInfeasibleError"
  }
}

const isVerticalSide = (side: ImplicitBreakoutEdge): boolean =>
  side === "left" || side === "right"

const getTangent = (
  side: ImplicitBreakoutEdge,
  point: { readonly x: number; readonly y: number },
): number => (isVerticalSide(side) ? point.y : point.x)

const getTangentBounds = (
  side: ImplicitBreakoutEdge,
  bounds: ImplicitBreakoutBounds,
): readonly [number, number] =>
  isVerticalSide(side)
    ? [bounds.minY, bounds.maxY]
    : [bounds.minX, bounds.maxX]

const getNormalPosition = (
  side: ImplicitBreakoutEdge,
  bounds: ImplicitBreakoutBounds,
  offset: number,
): number => {
  if (side === "left") return bounds.minX - offset
  if (side === "right") return bounds.maxX + offset
  if (side === "bottom") return bounds.minY - offset
  return bounds.maxY + offset
}

const makePoint = (
  side: ImplicitBreakoutEdge,
  normal: number,
  tangent: number,
): { x: number; y: number } =>
  isVerticalSide(side)
    ? { x: normal, y: tangent }
    : { x: tangent, y: normal }

const pointInsideBounds = (
  point: { readonly x: number; readonly y: number },
  bounds: ImplicitBreakoutBounds,
  margin = 0,
): boolean =>
  point.x >= bounds.minX - margin - EPSILON &&
  point.x <= bounds.maxX + margin + EPSILON &&
  point.y >= bounds.minY - margin - EPSILON &&
  point.y <= bounds.maxY + margin + EPSILON

const pointStrictlyInsideBounds = (
  point: { readonly x: number; readonly y: number },
  bounds: ImplicitBreakoutBounds,
  margin = 0,
): boolean =>
  point.x > bounds.minX - margin + EPSILON &&
  point.x < bounds.maxX + margin - EPSILON &&
  point.y > bounds.minY - margin + EPSILON &&
  point.y < bounds.maxY + margin - EPSILON

const pointOnBounds = (
  point: { readonly x: number; readonly y: number },
  bounds: ImplicitBreakoutBounds,
): boolean =>
  pointInsideBounds(point, bounds) &&
  (Math.abs(point.x - bounds.minX) <= EPSILON ||
    Math.abs(point.x - bounds.maxX) <= EPSILON ||
    Math.abs(point.y - bounds.minY) <= EPSILON ||
    Math.abs(point.y - bounds.maxY) <= EPSILON)

const axisAlignedSegmentIntersectsBounds = (
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
  bounds: ImplicitBreakoutBounds,
  margin = 0,
): boolean =>
  Math.max(start.x, end.x) >= bounds.minX - margin - EPSILON &&
  Math.min(start.x, end.x) <= bounds.maxX + margin + EPSILON &&
  Math.max(start.y, end.y) >= bounds.minY - margin - EPSILON &&
  Math.min(start.y, end.y) <= bounds.maxY + margin + EPSILON

const getConnectionIds = (
  input: ImplicitBreakoutPointSolverInput,
): readonly ConnectionId[] =>
  input.connections.flatMap((connection) =>
    "type" in connection
      ? connection.connections.map((member) => member.connectionId)
      : [connection.connectionId],
  )

const getEndpointPosition = (
  input: ImplicitBreakoutPointSolverInput,
  connectionId: ConnectionId,
  regionId: string,
): { readonly x: number; readonly y: number } => {
  for (const connection of input.connections) {
    const members =
      "type" in connection ? connection.connections : [connection]
    const member = members.find(
      (candidate) => candidate.connectionId === connectionId,
    )
    const endpoint = member?.endpoints.find(
      (candidate) => candidate.regionId === regionId,
    )
    if (endpoint) return endpoint.position
  }
  throw new Error(
    `Implicit breakout bank planner cannot find connection "${connectionId}" in region "${regionId}"`,
  )
}

const getRegionById = (
  input: ImplicitBreakoutPointSolverInput,
): ReadonlyMap<string, ImplicitBreakoutRegion> =>
  new Map(input.regions.map((region) => [region.regionId, region]))

const getBasePoint = (
  output: ImplicitBreakoutPointSolverOutput,
  regionId: string,
  connectionId: ConnectionId,
) => {
  const point = output.breakoutPoints.find(
    (candidate) =>
      candidate.regionId === regionId &&
      candidate.connectionId === connectionId,
  )
  if (!point) {
    throw new Error(
      `Implicit breakout bank planner is missing base point "${regionId}:${connectionId}"`,
    )
  }
  return point
}

const getSidePatterns = (
  regions: readonly ImplicitBreakoutRegion[],
): readonly (readonly ImplicitBreakoutEdge[])[] => {
  const vertical = regions.every((region) => isVerticalSide(region.edge))
  const preferred = regions.map((region) => region.edge)
  const perpendicularFirst = regions.map(() =>
    vertical ? ("top" as const) : ("right" as const),
  )
  const perpendicularSecond = regions.map(() =>
    vertical ? ("bottom" as const) : ("left" as const),
  )
  const opposite = regions.map((region): ImplicitBreakoutEdge => {
    if (region.edge === "left") return "right"
    if (region.edge === "right") return "left"
    if (region.edge === "bottom") return "top"
    return "bottom"
  })
  return [preferred, perpendicularFirst, perpendicularSecond, opposite]
}

const pointSegmentDistance = (
  point: { readonly x: number; readonly y: number },
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
): number => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared <= EPSILON) {
    return Math.hypot(point.x - start.x, point.y - start.y)
  }
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        lengthSquared,
    ),
  )
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy))
}

const orientation = (
  first: { readonly x: number; readonly y: number },
  second: { readonly x: number; readonly y: number },
  third: { readonly x: number; readonly y: number },
): number =>
  (second.x - first.x) * (third.y - first.y) -
  (second.y - first.y) * (third.x - first.x)

const pointOnSegment = (
  point: { readonly x: number; readonly y: number },
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
): boolean =>
  Math.abs(orientation(start, end, point)) <= EPSILON &&
  point.x >= Math.min(start.x, end.x) - EPSILON &&
  point.x <= Math.max(start.x, end.x) + EPSILON &&
  point.y >= Math.min(start.y, end.y) - EPSILON &&
  point.y <= Math.max(start.y, end.y) + EPSILON

const segmentsIntersect = (
  firstStart: { readonly x: number; readonly y: number },
  firstEnd: { readonly x: number; readonly y: number },
  secondStart: { readonly x: number; readonly y: number },
  secondEnd: { readonly x: number; readonly y: number },
): boolean => {
  const firstSecondStart = orientation(firstStart, firstEnd, secondStart)
  const firstSecondEnd = orientation(firstStart, firstEnd, secondEnd)
  const secondFirstStart = orientation(secondStart, secondEnd, firstStart)
  const secondFirstEnd = orientation(secondStart, secondEnd, firstEnd)
  if (
    ((firstSecondStart > EPSILON && firstSecondEnd < -EPSILON) ||
      (firstSecondStart < -EPSILON && firstSecondEnd > EPSILON)) &&
    ((secondFirstStart > EPSILON && secondFirstEnd < -EPSILON) ||
      (secondFirstStart < -EPSILON && secondFirstEnd > EPSILON))
  ) {
    return true
  }
  return (
    pointOnSegment(secondStart, firstStart, firstEnd) ||
    pointOnSegment(secondEnd, firstStart, firstEnd) ||
    pointOnSegment(firstStart, secondStart, secondEnd) ||
    pointOnSegment(firstEnd, secondStart, secondEnd)
  )
}

const segmentDistance = (
  firstStart: { readonly x: number; readonly y: number },
  firstEnd: { readonly x: number; readonly y: number },
  secondStart: { readonly x: number; readonly y: number },
  secondEnd: { readonly x: number; readonly y: number },
): number => {
  if (segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)) return 0
  return Math.min(
    pointSegmentDistance(firstStart, secondStart, secondEnd),
    pointSegmentDistance(firstEnd, secondStart, secondEnd),
    pointSegmentDistance(secondStart, firstStart, firstEnd),
    pointSegmentDistance(secondEnd, firstStart, firstEnd),
  )
}

const getCandidateSegments = (candidate: BankCandidate) => {
  const pointsByRegionId = Map.groupBy(
    candidate.breakoutPoints,
    (point) => point.regionId,
  )
  return [...pointsByRegionId.entries()].map(([regionId, points]) => ({
    regionId,
    start: points[0]!,
    end: points[points.length - 1]!,
  }))
}

const candidatesAreCompatible = (
  first: BankCandidate,
  second: BankCandidate,
  minimumLanePitch: number,
): boolean => {
  if (first.selectedLayer !== second.selectedLayer) return true
  for (const firstSegment of getCandidateSegments(first)) {
    for (const secondSegment of getCandidateSegments(second)) {
      if (firstSegment.regionId !== secondSegment.regionId) continue
      if (
        segmentDistance(
          firstSegment.start,
          firstSegment.end,
          secondSegment.start,
          secondSegment.end,
        ) <
        minimumLanePitch - EPSILON
      ) {
        return false
      }
    }
  }
  return true
}

const compareCandidates = (
  first: BankCandidate,
  second: BankCandidate,
): number =>
  first.sideRank - second.sideRank ||
  second.tangentPitch - first.tangentPitch ||
  Math.abs(first.tangentShift) - Math.abs(second.tangentShift) ||
  first.normalOffset - second.normalOffset ||
  first.key.localeCompare(second.key)

const compareJointStates = (first: JointState, second: JointState): number =>
  first.maximumSideRank - second.maximumSideRank ||
  first.sideRankSum - second.sideRankSum ||
  second.minimumPitch - first.minimumPitch ||
  first.totalShift - second.totalShift ||
  first.totalNormalOffset - second.totalNormalOffset ||
  first.key.localeCompare(second.key)

const makeBusCandidates = ({
  input,
  baseOutput,
  bus,
  context,
  maximumCandidateBanksPerBus,
}: {
  input: ImplicitBreakoutPointSolverInput
  baseOutput: ImplicitBreakoutPointSolverOutput
  bus: ImplicitBreakoutBus
  context: ImplicitBreakoutBankPlanningContext
  maximumCandidateBanksPerBus: number
}): BankCandidate[] => {
  const regionById = getRegionById(input)
  const firstRegion = input.regions[0]!
  const orderedBasePoints = bus.connectionIds
    .map((connectionId) =>
      getBasePoint(baseOutput, firstRegion.regionId, connectionId),
    )
    .sort(
      (first, second) =>
        getTangent(firstRegion.edge, first) -
          getTangent(firstRegion.edge, second) ||
        first.connectionId.localeCompare(second.connectionId),
    )
  const connectionIdsInWindingOrder = orderedBasePoints.map(
    (point) => point.connectionId,
  )
  const selectedLayers = new Set(
    input.regions.flatMap((region) =>
      connectionIdsInWindingOrder.map(
        (connectionId) =>
          getBasePoint(baseOutput, region.regionId, connectionId).layer,
      ),
    ),
  )
  if (selectedLayers.size !== 1) {
    throw new ImplicitBreakoutBankInfeasibleError(
      `Implicit breakout bus "${bus.busId}" has inconsistent base layers`,
    )
  }
  const selectedLayer = [...selectedLayers][0]!
  const minimumLanePitch = input.boundaryPointSpacing
  const candidates: BankCandidate[] = []
  for (const [sideRank, sidePattern] of getSidePatterns(input.regions).entries()) {
    const vertical = sidePattern.every(isVerticalSide)
    if (!vertical && !sidePattern.every((side) => !isVerticalSide(side))) {
      continue
    }
    const desiredCentroid =
      input.regions.reduce((regionSum, region) => {
        const side = sidePattern[input.regions.indexOf(region)]!
        return (
          regionSum +
          connectionIdsInWindingOrder.reduce(
            (sum, connectionId) =>
              sum +
              getTangent(
                side,
                getEndpointPosition(input, connectionId, region.regionId),
              ),
            0,
          ) /
            connectionIdsInWindingOrder.length
        )
      }, 0) / input.regions.length
    const [boardTangentMinimum, boardTangentMaximum] = getTangentBounds(
      sidePattern[0]!,
      context.boardBounds,
    )
    for (const pitchMultiplier of PITCH_MULTIPLIERS) {
      const tangentPitch = minimumLanePitch * pitchMultiplier
      const tangentSpan =
        tangentPitch * Math.max(0, connectionIdsInWindingOrder.length - 1)
      if (
        tangentSpan >
        boardTangentMaximum - boardTangentMinimum + EPSILON
      ) {
        continue
      }
      for (const shiftMultiplier of SHIFT_MULTIPLIERS) {
        const requestedShift = shiftMultiplier * minimumLanePitch
        const unclampedStart =
          desiredCentroid - tangentSpan / 2 + requestedShift
        const tangentStart = Math.max(
          boardTangentMinimum,
          Math.min(boardTangentMaximum - tangentSpan, unclampedStart),
        )
        const tangentShift =
          tangentStart + tangentSpan / 2 - desiredCentroid
        for (const normalMultiplier of NORMAL_OFFSET_MULTIPLIERS) {
          const normalOffset = normalMultiplier * minimumLanePitch
          const breakoutPoints: Array<
            ImplicitBreakoutPointSolverOutput["breakoutPoints"][number]
          > = []
          const provenance: ImplicitBreakoutBankPointProvenance[] = []
          const sideByRegionId: Record<string, ImplicitBreakoutEdge> = {}
          let valid = true
          for (
            let regionIndex = 0;
            regionIndex < input.regions.length;
            regionIndex++
          ) {
            const region = input.regions[regionIndex]!
            const side = sidePattern[regionIndex]!
            sideByRegionId[region.regionId] = side
            const normal = getNormalPosition(side, region.bounds, normalOffset)
            for (
              let rank = 0;
              rank < connectionIdsInWindingOrder.length;
              rank++
            ) {
              const connectionId = connectionIdsInWindingOrder[rank]!
              const point = makePoint(
                side,
                normal,
                tangentStart + rank * tangentPitch,
              )
              const physicalBoundaryPoint = makePoint(
                side,
                getNormalPosition(side, region.bounds, 0),
                tangentStart + rank * tangentPitch,
              )
              if (!pointInsideBounds(point, context.boardBounds)) {
                valid = false
                break
              }
              for (const otherRegion of input.regions) {
                if (otherRegion.regionId === region.regionId) continue
                if (
                  pointStrictlyInsideBounds(point, otherRegion.bounds) ||
                  (normalOffset > 0 &&
                    axisAlignedSegmentIntersectsBounds(
                      physicalBoundaryPoint,
                      point,
                      otherRegion.bounds,
                    ))
                ) {
                  valid = false
                  break
                }
              }
              if (!valid) break
              if (
                (context.obstacles ?? []).some(
                  (obstacle) =>
                    pointInsideBounds(
                      point,
                      obstacle.bounds,
                      minimumLanePitch / 2,
                    ) ||
                    (normalOffset > 0 &&
                      axisAlignedSegmentIntersectsBounds(
                        physicalBoundaryPoint,
                        point,
                        obstacle.bounds,
                        minimumLanePitch / 2,
                      )),
                )
              ) {
                valid = false
                break
              }
              const virtual = !pointOnBounds(point, region.bounds)
              breakoutPoints.push({
                regionId: region.regionId,
                connectionId,
                layer: selectedLayer,
                ...point,
              })
              provenance.push({
                regionId: region.regionId,
                connectionId,
                busId: bus.busId,
                selectedLayer,
                rank,
                side,
                tangentPitch,
                tangentShift,
                normalOffset,
                virtual,
              })
            }
            if (!valid) break
          }
          if (!valid) continue
          const key = `${bus.busId}:${sidePattern.join(",")}:${tangentPitch.toFixed(9)}:${tangentShift.toFixed(9)}:${normalOffset.toFixed(9)}`
          candidates.push({
            busId: bus.busId,
            selectedLayer,
            connectionIdsInWindingOrder,
            points: provenance,
            breakoutPoints,
            sideRank,
            tangentPitch,
            tangentShift,
            normalOffset,
            sideByRegionId: Object.freeze(sideByRegionId),
            key,
          })
        }
      }
    }
  }
  candidates.sort(compareCandidates)
  const deduplicated = new Map<string, BankCandidate>()
  for (const candidate of candidates) {
    const geometryKey = candidate.breakoutPoints
      .map(
        (point) =>
          `${point.regionId}:${point.connectionId}:${point.x.toFixed(9)}:${point.y.toFixed(9)}`,
      )
      .join("|")
    if (!deduplicated.has(geometryKey)) {
      deduplicated.set(geometryKey, candidate)
    }
  }
  const candidateBuckets = Map.groupBy(
    [...deduplicated.values()],
    (candidate) =>
      `${candidate.sideRank}:${candidate.tangentPitch.toFixed(9)}:${candidate.tangentShift.toFixed(9)}`,
  )
  const orderedBuckets = [...candidateBuckets.entries()]
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([, bucket]) => bucket.sort(compareCandidates))
  const retained: BankCandidate[] = []
  for (
    let bucketIndex = 0;
    retained.length < maximumCandidateBanksPerBus;
    bucketIndex++
  ) {
    let added = false
    for (const bucket of orderedBuckets) {
      const candidate = bucket[bucketIndex]
      if (!candidate) continue
      retained.push(candidate)
      added = true
      if (retained.length === maximumCandidateBanksPerBus) break
    }
    if (!added) break
  }
  retained.sort(compareCandidates)
  return retained
}

/**
 * Transform WindingBreakoutSolver's physical-edge output into deterministic,
 * board-world virtual channel banks. Coordinates are PCB millimeters with +X
 * right and +Y top. Connection identity order and selected bus layer remain
 * immutable; only planner-owned target positions move.
 */
export const planImplicitBreakoutBanks = ({
  input,
  baseOutput,
  context,
}: {
  input: ImplicitBreakoutPointSolverInput
  baseOutput: ImplicitBreakoutPointSolverOutput
  context: ImplicitBreakoutBankPlanningContext
}): PlannedImplicitBreakoutPointSolverOutput => {
  const maximumCandidateBanksPerBus =
    context.maximumCandidateBanksPerBus ??
    DEFAULT_MAXIMUM_CANDIDATE_BANKS_PER_BUS
  const maximumJointStates =
    context.maximumJointStates ?? DEFAULT_MAXIMUM_JOINT_STATES
  if (
    !Number.isInteger(maximumCandidateBanksPerBus) ||
    maximumCandidateBanksPerBus <= 0 ||
    !Number.isInteger(maximumJointStates) ||
    maximumJointStates <= 0
  ) {
    throw new Error("Implicit breakout bank planner caps must be positive integers")
  }
  const allConnectionIds = new Set(getConnectionIds(input))
  const busConnectionIds = new Set(
    input.buses.flatMap((bus) => bus.connectionIds),
  )
  if (
    [...busConnectionIds].some((connectionId) => !allConnectionIds.has(connectionId))
  ) {
    throw new Error("Implicit breakout bank planner bus references unknown connection")
  }
  const orderedBuses = [...input.buses].sort((first, second) =>
    first.busId.localeCompare(second.busId),
  )
  const candidatesByBusId = new Map(
    orderedBuses.map((bus) => [
      bus.busId,
      makeBusCandidates({
        input,
        baseOutput,
        bus,
        context,
        maximumCandidateBanksPerBus,
      }),
    ]),
  )
  for (const bus of orderedBuses) {
    if (candidatesByBusId.get(bus.busId)!.length === 0) {
      throw new ImplicitBreakoutBankInfeasibleError(
        `Implicit breakout bus "${bus.busId}" has no legal ordered bank`,
      )
    }
  }
  let states: JointState[] = [
    {
      candidates: [],
      maximumSideRank: 0,
      sideRankSum: 0,
      minimumPitch: Number.POSITIVE_INFINITY,
      totalShift: 0,
      totalNormalOffset: 0,
      key: "",
    },
  ]
  for (const bus of orderedBuses) {
    const nextStates: JointState[] = []
    for (const state of states) {
      for (const candidate of candidatesByBusId.get(bus.busId)!) {
        if (
          !state.candidates.every((selected) =>
            candidatesAreCompatible(
              selected,
              candidate,
              input.boundaryPointSpacing,
            ),
          )
        ) {
          continue
        }
        const candidates = [...state.candidates, candidate]
        nextStates.push({
          candidates,
          maximumSideRank: Math.max(state.maximumSideRank, candidate.sideRank),
          sideRankSum: state.sideRankSum + candidate.sideRank,
          minimumPitch: Math.min(state.minimumPitch, candidate.tangentPitch),
          totalShift: state.totalShift + Math.abs(candidate.tangentShift),
          totalNormalOffset:
            state.totalNormalOffset + candidate.normalOffset,
          key: candidates.map((item) => item.key).join("|"),
        })
      }
    }
    nextStates.sort(compareJointStates)
    states = nextStates.slice(0, maximumJointStates)
    if (states.length === 0) {
      throw new ImplicitBreakoutBankInfeasibleError(
        `Implicit breakout banks are jointly infeasible after bus "${bus.busId}"`,
      )
    }
  }
  const selected = states[0]!
  const plannedConnectionIds = new Set(
    selected.candidates.flatMap((candidate) =>
      candidate.connectionIdsInWindingOrder.map((connectionId) =>
        String(connectionId),
      ),
    ),
  )
  const unplannedPoints = baseOutput.breakoutPoints.filter(
    (point) => !plannedConnectionIds.has(String(point.connectionId)),
  )
  const assignments = selected.candidates.map(
    (candidate): ImplicitBreakoutBankAssignment =>
      Object.freeze({
        busId: candidate.busId,
        selectedLayer: candidate.selectedLayer,
        connectionIdsInWindingOrder: Object.freeze([
          ...candidate.connectionIdsInWindingOrder,
        ]),
        tangentPitch: candidate.tangentPitch,
        tangentShift: candidate.tangentShift,
        normalOffset: candidate.normalOffset,
        sideByRegionId: candidate.sideByRegionId,
      }),
  )
  const pointProvenance = selected.candidates.flatMap(
    (candidate) => candidate.points,
  )
  const breakoutPoints = [
    ...unplannedPoints,
    ...selected.candidates.flatMap((candidate) => candidate.breakoutPoints),
  ].sort(
    (first, second) =>
      first.regionId.localeCompare(second.regionId) ||
      first.connectionId.localeCompare(second.connectionId),
  )
  return Object.freeze({
    breakoutPoints: Object.freeze(breakoutPoints),
    bankPlan: Object.freeze({
      minimumLanePitch: input.boundaryPointSpacing,
      desiredLanePitch: input.boundaryPointSpacing * 2,
      assignments: Object.freeze(assignments),
      pointProvenance: Object.freeze(pointProvenance),
      virtualPointKeys: Object.freeze(
        pointProvenance
          .filter((point) => point.virtual)
          .map((point) => `${point.regionId}:${point.connectionId}`)
          .sort(),
      ),
    }),
  })
}
