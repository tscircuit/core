import type { PcbPort } from "circuit-json"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Port } from "../Port"
import type { Trace } from "../Trace/Trace"
import { getSavedPcbRouteInBoardFrame } from "./get-saved-pcb-trace-path-transform"
import { getSavedRouteContacts } from "./get-saved-route-contacts"

/** Find implicit phase targets whose PCB ports are joined by saved copper. */
export function getTracesCoveredBySavedPhase(
  phase: AutoroutingPhase,
  candidates: Trace[],
) {
  const group = phase.getGroup()!
  const subcircuit = phase.getSubcircuit()
  const { db } = phase.root!
  const routes = (phase._parsedProps.pcbTracePaths ?? []).flatMap(
    ({ connection, route }) => {
      const port = subcircuit.selectOne<Port>(connection, { type: "port" })
      return port?.pcb_port_id
        ? [getSavedPcbRouteInBoardFrame(group, port, route)]
        : []
    },
  )

  const terminals: PcbPort[] = []
  const terminalIndicesByTrace = candidates.map((trace) =>
    (trace._findConnectedPorts().ports ?? []).flatMap(({ pcb_port_id }) => {
      const port = pcb_port_id ? db.pcb_port.get(pcb_port_id) : null
      return port ? [terminals.push(port) - 1] : []
    }),
  )
  const pcbBoardId = phase._getBoard()?.pcb_board_id
  const contacts = getSavedRouteContacts(routes, terminals, {
    layerCount: subcircuit._getSubcircuitLayerCount(),
    allowBlindAndBuriedVias: pcbBoardId
      ? db.pcb_board.get(pcbBoardId)?.allow_blind_and_buried_vias
      : undefined,
  })
  const copperComponents = new Set(contacts.routeComponents)
  return candidates.filter((_, index) => {
    const terminalIndices = terminalIndicesByTrace[index]!
    const component = contacts.terminalComponents[terminalIndices[0]!]
    return (
      component !== undefined &&
      copperComponents.has(component) &&
      terminalIndices.every(
        (terminalIndex) =>
          contacts.terminalComponents[terminalIndex] === component,
      )
    )
  })
}
