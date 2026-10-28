import {
  FanoutSolver,
  type FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import {
  type BusFanoutDirection,
  type BusFanoutDirectionLiteral,
  type CanonicalBusFanoutDirection,
  type FanoutBoundaryPadding,
  canonicalBusFanoutDirectionValues,
} from "@tscircuit/props"

import type { SimpleRouteBounds, SimpleRouteBus } from "./SimpleRouteJson"

export type FanoutAutorouterMode = "single_layer_fanout" | "fanout"

export interface FanoutAutorouterOptions {
  mode: FanoutAutorouterMode
  busFanoutDirections?: Readonly<Record<string, BusFanoutDirection>>
  fanoutBounds?: SimpleRouteBounds
  fanoutRoutingLayers?: string[]
  allowBlindAndBuriedVias?: boolean
  /** Used to name components in fanout failure messages. */
  componentNamesById?: ReadonlyMap<string, string>
  onSolverStarted?: (details: {
    solverName: "FanoutSolver"
    solverParams: ReturnType<FanoutSolver["getConstructorParams"]>[0]
    solverConstructorArgs: ReturnType<FanoutSolver["getConstructorParams"]>
  }) => void
}

export interface ResolveFanoutBoundsOptions extends FanoutAutorouterOptions {
  fanoutBoundaryPadding?: FanoutBoundaryPadding
  breakoutPoints?: ReadonlyArray<{ x: number; y: number }>
  onFanoutBoundsConflict?: () => void
}

export const getFanoutSolverBuses = (
  buses: readonly SimpleRouteBus[] | undefined,
  busFanoutDirections?: Readonly<Record<string, BusFanoutDirection>>,
): FanoutSolverOptions["buses"] =>
  buses?.map((bus) => {
    const { preferredLayer, preferredLayers, ...fanoutBusWithoutPreferences } =
      bus
    const requestedDirection = busFanoutDirections?.[bus.busId]
    const requestedDirectionLiteral =
      requestedDirection === undefined
        ? undefined
        : getBusFanoutDirectionLiteral(requestedDirection)
    // `center` is shared with NinePointAnchor and has always meant
    // unconstrained routing, so only edge-specific canonical values opt in.
    const exitPosition =
      requestedDirectionLiteral &&
      requestedDirectionLiteral !== "center" &&
      isCanonicalBusFanoutDirection(requestedDirectionLiteral)
        ? requestedDirectionLiteral
        : undefined
    const fanoutBus = {
      ...fanoutBusWithoutPreferences,
      ...(bus.termination?.type === "plane"
        ? {}
        : exitPosition
          ? { exitPosition }
          : {}),
    }
    const requestedFanoutLayers = [
      ...(preferredLayer === undefined ? [] : [preferredLayer]),
      ...(preferredLayers ?? []),
    ].filter((layer, index, layers) => layers.indexOf(layer) === index)
    if (requestedFanoutLayers.length === 0) {
      return fanoutBus
    }
    const busAllowedLayers = bus.allowedLayers
    const allowedLayers =
      busAllowedLayers === undefined
        ? requestedFanoutLayers
        : requestedFanoutLayers.filter((layer) =>
            busAllowedLayers.includes(layer),
          )
    return {
      ...fanoutBus,
      allowedLayers,
    }
  })

export const getBusFanoutDirectionLiteral = (
  fanoutDirection: BusFanoutDirection,
): BusFanoutDirectionLiteral =>
  typeof fanoutDirection === "string"
    ? fanoutDirection
    : fanoutDirection.direction

const canonicalBusFanoutDirections = new Set<CanonicalBusFanoutDirection>(
  canonicalBusFanoutDirectionValues,
)

export const isCanonicalBusFanoutDirection = (
  direction: BusFanoutDirectionLiteral,
): direction is CanonicalBusFanoutDirection =>
  canonicalBusFanoutDirections.has(direction as CanonicalBusFanoutDirection)
