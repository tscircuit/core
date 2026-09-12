import type {
  SimpleRouteConnection,
  SimpleRoutePoint,
  SingleLayerConnectionPoint,
} from "../../lib/utils/autorouting/SimpleRouteJson"

type Assert<T extends true> = T
type MixedPoint = { x: number; y: number; layer: string; layers: string[] }
type MultilayerPoint = { x: number; y: number; layers: string[] }
type FixedLayerPoint = { x: number; y: number; layer: string }

type RejectMixedPoint = Assert<
  MixedPoint extends SingleLayerConnectionPoint ? false : true
>
type RejectMixedLegacyName = Assert<
  MixedPoint extends SimpleRoutePoint ? false : true
>
type RejectMultilayerPoint = Assert<
  MultilayerPoint extends SimpleRoutePoint ? false : true
>
type RejectMixedConnection = Assert<
  { name: string; pointsToConnect: MixedPoint[] } extends SimpleRouteConnection
    ? false
    : true
>
type AcceptSingleLayerPoint = Assert<
  FixedLayerPoint extends SimpleRoutePoint ? true : false
>
