import {
  getDifferentialPairRoutingFailure as getAutorouterDifferentialPairRoutingFailure,
  type RoutingFailure,
  type SimpleRouteJson as AutorouterSimpleRouteJson,
  type SimplifiedPcbTrace as AutorouterSimplifiedPcbTrace,
} from "@tscircuit/capacity-autorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

// Core also accepts unnamed and extended custom-router traces. The shared
// validator checks their final geometry and ownership at this boundary.
export const getDifferentialPairRoutingFailure = (
  input: SimpleRouteJson,
  traces: SimplifiedPcbTrace[],
): RoutingFailure | undefined =>
  getAutorouterDifferentialPairRoutingFailure(
    input as AutorouterSimpleRouteJson,
    traces as AutorouterSimplifiedPcbTrace[],
  )
