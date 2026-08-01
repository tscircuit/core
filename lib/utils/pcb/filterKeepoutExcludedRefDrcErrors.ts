import type { AnyCircuitElement, PcbPlatedHole, PcbSmtPad } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { Keepout } from "lib/components/primitive-components/Keepout"

type PcbConnectionElement = PcbSmtPad | PcbPlatedHole

const isPcbConnectionElement = (
  element: AnyCircuitElement,
): element is PcbConnectionElement =>
  element.type === "pcb_smtpad" || element.type === "pcb_plated_hole"

const getPcbConnectionElementId = (element: PcbConnectionElement): string =>
  element.type === "pcb_smtpad"
    ? element.pcb_smtpad_id
    : element.pcb_plated_hole_id

/**
 * `excludeRefs` does not weaken keepouts for autorouting. It only suppresses a
 * keepout overlap diagnostic when the violating trace is electrically
 * connected to a selected component, which supports intentional manual routes
 * such as antenna feeds.
 */
export const filterKeepoutExcludedRefDrcErrors = ({
  circuitJson,
  drcResults,
  keepouts,
}: {
  circuitJson: AnyCircuitElement[]
  drcResults: AnyCircuitElement[]
  keepouts: Keepout[]
}): AnyCircuitElement[] => {
  const keepoutExclusions = keepouts.flatMap((keepout) => {
    if (!keepout.pcb_keepout_id) return []

    const excludedPcbComponentIds = new Set(
      keepout.getExcludedPcbComponentIds(),
    )
    if (excludedPcbComponentIds.size === 0) return []

    return [
      {
        pcbKeepoutId: keepout.pcb_keepout_id,
        excludedPcbComponentIds,
      },
    ]
  })
  if (keepoutExclusions.length === 0) return drcResults

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const pcbConnectionElements = circuitJson.filter(isPcbConnectionElement)

  return drcResults.filter((result) => {
    if (result.type !== "pcb_trace_error") return true

    const isExcludedKeepoutViolation = keepoutExclusions.some(
      ({ pcbKeepoutId, excludedPcbComponentIds }) => {
        if (
          result.pcb_trace_error_id !==
          `overlap_${result.pcb_trace_id}_${pcbKeepoutId}`
        ) {
          return false
        }

        return pcbConnectionElements.some((element) => {
          if (
            !element.pcb_component_id ||
            !excludedPcbComponentIds.has(element.pcb_component_id)
          ) {
            return false
          }

          return connMap.areIdsConnected(
            result.pcb_trace_id,
            getPcbConnectionElementId(element),
          )
        })
      },
    )

    return !isExcludedKeepoutViolation
  })
}
