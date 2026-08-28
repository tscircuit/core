import type { ImplicitBreakoutBus } from "@tscircuit/props"

export type ImplicitBreakoutBusId = ImplicitBreakoutBus["busId"]

export interface BusLayerAssignment {
  readonly busId: ImplicitBreakoutBusId
  readonly connectionIds: readonly string[]
  readonly selectedLayer: string
  readonly preferenceRank: number
}

export interface BusLayerPlan {
  readonly assignments: readonly BusLayerAssignment[]
}

interface PlanningState {
  readonly assignments: readonly BusLayerAssignment[]
  readonly connectionLoadByLayer: Readonly<Record<string, number>>
}

const DEFAULT_BUS_LAYER = "top"
const DEFAULT_MAX_CANDIDATE_PLANS = 512

const getCandidateLayers = (bus: ImplicitBreakoutBus): readonly string[] => {
  const candidates = [...new Set(bus.targetLayers ?? [DEFAULT_BUS_LAYER])]
  if (candidates.length === 0) {
    throw new Error(`Implicit breakout bus "${bus.busId}" has no common layer`)
  }
  for (const layer of candidates) {
    if (layer.trim().length === 0) {
      throw new Error(
        `Implicit breakout bus "${bus.busId}" has an invalid empty layer`,
      )
    }
  }
  return candidates
}

const comparePlanningStates = (
  first: PlanningState,
  second: PlanningState,
): number => {
  const firstLoads = Object.values(first.connectionLoadByLayer)
  const secondLoads = Object.values(second.connectionLoadByLayer)
  const firstMaximumLoad = Math.max(0, ...firstLoads)
  const secondMaximumLoad = Math.max(0, ...secondLoads)
  if (firstMaximumLoad !== secondMaximumLoad) {
    return firstMaximumLoad - secondMaximumLoad
  }

  const firstSquaredLoad = firstLoads.reduce(
    (sum, load) => sum + load * load,
    0,
  )
  const secondSquaredLoad = secondLoads.reduce(
    (sum, load) => sum + load * load,
    0,
  )
  if (firstSquaredLoad !== secondSquaredLoad) {
    return firstSquaredLoad - secondSquaredLoad
  }

  const firstPreferenceRank = first.assignments.reduce(
    (sum, assignment) => sum + assignment.preferenceRank,
    0,
  )
  const secondPreferenceRank = second.assignments.reduce(
    (sum, assignment) => sum + assignment.preferenceRank,
    0,
  )
  if (firstPreferenceRank !== secondPreferenceRank) {
    return firstPreferenceRank - secondPreferenceRank
  }

  for (
    let assignmentIndex = 0;
    assignmentIndex < first.assignments.length;
    assignmentIndex++
  ) {
    const rankDifference =
      first.assignments[assignmentIndex]!.preferenceRank -
      second.assignments[assignmentIndex]!.preferenceRank
    if (rankDifference !== 0) return rankDifference
  }

  const firstKey = first.assignments
    .map((assignment) => `${assignment.busId}:${assignment.selectedLayer}`)
    .join("|")
  const secondKey = second.assignments
    .map((assignment) => `${assignment.busId}:${assignment.selectedLayer}`)
    .join("|")
  return firstKey.localeCompare(secondKey)
}

const validateBusMembership = (buses: readonly ImplicitBreakoutBus[]): void => {
  const busIds = new Set<ImplicitBreakoutBusId>()
  const busIdByConnectionId = new Map<string, ImplicitBreakoutBusId>()
  for (const bus of buses) {
    if (busIds.has(bus.busId)) {
      throw new Error(`Duplicate implicit breakout bus "${bus.busId}"`)
    }
    busIds.add(bus.busId)
    getCandidateLayers(bus)
    for (const connectionId of bus.connectionIds) {
      const existingBusId = busIdByConnectionId.get(connectionId)
      if (existingBusId !== undefined) {
        throw new Error(
          `Implicit breakout connection "${connectionId}" belongs to both bus "${existingBusId}" and bus "${bus.busId}"`,
        )
      }
      busIdByConnectionId.set(connectionId, bus.busId)
    }
  }
}

/**
 * Build bounded, deterministic whole-bus layer plans. Each returned assignment
 * selects one layer for every connection in a signal bus. Singleton target
 * lists (the Core representation of JSX preferredLayer) are therefore fixed.
 *
 * Plans are ordered by channel congestion, declared layer preference, then a
 * stable key. The caller may test each plan against its full geometric solver;
 * this keeps feasibility authoritative without allowing per-net reassignment.
 */
export const planImplicitBreakoutBusLayers = (
  buses: readonly ImplicitBreakoutBus[],
  options: { readonly maximumCandidatePlans?: number } = {},
): readonly BusLayerPlan[] => {
  validateBusMembership(buses)
  const maximumCandidatePlans =
    options.maximumCandidatePlans ?? DEFAULT_MAX_CANDIDATE_PLANS
  if (!Number.isInteger(maximumCandidatePlans) || maximumCandidatePlans <= 0) {
    throw new Error("maximumCandidatePlans must be a positive integer")
  }

  const orderedBuses = [...buses].sort((first, second) =>
    first.busId.localeCompare(second.busId),
  )
  let states: PlanningState[] = [
    {
      assignments: Object.freeze([]),
      connectionLoadByLayer: Object.freeze({}),
    },
  ]
  for (const bus of orderedBuses) {
    const candidates = getCandidateLayers(bus)
    const expandedStates = states.flatMap((state) =>
      candidates.map((selectedLayer, preferenceRank): PlanningState => {
        const assignment = Object.freeze({
          busId: bus.busId,
          connectionIds: Object.freeze([...bus.connectionIds]),
          selectedLayer,
          preferenceRank,
        })
        return {
          assignments: Object.freeze([...state.assignments, assignment]),
          connectionLoadByLayer: Object.freeze({
            ...state.connectionLoadByLayer,
            [selectedLayer]:
              (state.connectionLoadByLayer[selectedLayer] ?? 0) +
              bus.connectionIds.length,
          }),
        }
      }),
    )
    expandedStates.sort(comparePlanningStates)
    states = expandedStates.slice(0, maximumCandidatePlans)
  }

  return Object.freeze(
    states.map((state) =>
      Object.freeze({ assignments: Object.freeze([...state.assignments]) }),
    ),
  )
}

export const getBusLayerAssignment = (
  plan: BusLayerPlan,
  busId: ImplicitBreakoutBusId,
): BusLayerAssignment | undefined =>
  plan.assignments.find((assignment) => assignment.busId === busId)
