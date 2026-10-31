import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { fanoutTracePath, type FanoutTracePath } from "@tscircuit/props"
import { resolveSavedTraceRouteWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import { getLabeledPcbSvg } from "./get-labeled-pcb-svg"

/** These fixtures use untransformed groups: saved local XY points are board-world mm (+X right, +Y up). */
export function getSavedJunctionReviewSvg(
  circuitJson: AnyCircuitElement[],
  paths: FanoutTracePath[],
  title: string,
  details: string[],
  messages: string[],
): string {
  // Invalid paths are rejected before copper is emitted. Show the actual input
  // separately and label it as a proposal, never as successful routed output.
  const proposed: PcbTrace[] = paths.map((path, index) => ({
    type: "pcb_trace",
    pcb_trace_id: `proposed_${index}`,
    route: resolveSavedTraceRouteWidths(fanoutTracePath.parse(path).route),
  }))
  const actualTraces = circuitJson.filter((e) => e.type === "pcb_trace").length
  return getLabeledPcbSvg(
    [
      ...circuitJson.filter(
        (e) => e.type !== "pcb_trace" && !e.type.endsWith("_error"),
      ),
      ...proposed,
    ],
    title,
    [
      "PROPOSED INPUT PATHS shown below; red = top, blue = bottom.",
      ...details,
      `Observed: ${messages.length ? "REJECTED" : "ACCEPTED"}; ${actualTraces} traces emitted.`,
      ...messages,
    ],
  )
}
