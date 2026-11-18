import { distance } from "circuit-json"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "./getPresetAutoroutingConfig"

/** Apply the requested clearance after the phase has overridden board rules. */
export function applyAutorouterTraceClearance(
  simpleRouteJson: SimpleRouteJson,
  autorouterConfig: NormalizedAutorouterConfig,
): SimpleRouteJson {
  if (autorouterConfig.traceClearance === undefined) return simpleRouteJson

  return {
    ...simpleRouteJson,
    minTraceToPadEdgeClearance: Math.max(
      simpleRouteJson.minTraceToPadEdgeClearance ?? 0,
      distance.parse(autorouterConfig.traceClearance),
    ),
  }
}
