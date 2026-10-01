import type {
  SimpleRouteConnection,
  SingleLayerConnectionPoint,
} from "./SimpleRouteJson"

type SrjTerminalId = NonNullable<SingleLayerConnectionPoint["pointId"]>

/** Source connections sharing a PCB port belong to one electrical network. */
export const getLogicalConnectionGroups = (
  connections: readonly SimpleRouteConnection[],
): Map<SimpleRouteConnection, number> => {
  const parent = connections.map((_, index) => index)
  const find = (index: number): number => {
    let root = index
    while (parent[root] !== root) root = parent[root]!
    let current = index
    while (parent[current] !== current) {
      const next = parent[current]!
      parent[current] = root
      current = next
    }
    return root
  }
  const ownerByTerminalId = new Map<SrjTerminalId, number>()
  for (const [index, connection] of connections.entries()) {
    for (const terminal of connection.pointsToConnect) {
      const terminalId = terminal.pcb_port_id ?? terminal.pointId
      if (!terminalId) continue
      const owner = ownerByTerminalId.get(terminalId)
      if (owner === undefined) ownerByTerminalId.set(terminalId, index)
      else parent[find(index)] = find(owner)
    }
  }
  return new Map(
    connections.map((connection, index) => [connection, find(index)]),
  )
}
