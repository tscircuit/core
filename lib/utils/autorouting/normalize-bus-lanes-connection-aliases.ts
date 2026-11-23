import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { SimpleRouteJson, SrjConnectionName } from "./SimpleRouteJson"

type ElectricalNet = NonNullable<
  ReturnType<ConnectivityMap["getNetConnectedToId"]>
>

/** Preserve board-world geometry (right-handed mm, +X right/+Y up) while
 * expressing duplicate electrical handoffs under the bus lane's existing name.
 * The returned copper is a solver input view; original PCB traces stay intact. */
export function normalizeBusLanesConnectionAliases(
  input: SimpleRouteJson,
): SimpleRouteJson {
  const connectivity = new ConnectivityMap({})
  for (const connection of input.connections) {
    connectivity.addConnections([
      [
        connection.name,
        ...connection.pointsToConnect.flatMap((point) =>
          [point.pointId, point.pcb_port_id].filter((id): id is string =>
            Boolean(id),
          ),
        ),
      ],
    ])
  }
  for (const obstacle of input.obstacles)
    connectivity.addConnections([obstacle.connectedTo])
  for (const trace of input.traces ?? []) {
    connectivity.addConnections([
      [
        trace.pcb_trace_id,
        trace.connection_name,
        ...(trace.connectsTo ?? []),
      ].filter((id): id is string => Boolean(id)),
    ])
  }
  const busMembers = new Set([
    ...(input.buses?.flatMap((bus) => bus.connectionNames) ?? []),
    ...(input.differentialPairs?.flatMap((pair) => pair.connectionNames) ?? []),
  ])
  const groups = new Map<string, typeof input.connections>()
  for (const connection of input.connections) {
    const pointKeys = connection.pointsToConnect
      .map((point) =>
        JSON.stringify([
          point.pointId ?? point.pcb_port_id ?? [point.x, point.y],
          point.layer,
        ]),
      )
      .sort()
    const signature =
      connection.pointsToConnect.length === 2 && !connection.path?.length
        ? JSON.stringify(pointKeys)
        : JSON.stringify([connection.name])
    const group = groups.get(signature) ?? []
    group.push(connection)
    groups.set(signature, group)
  }
  const canonicalByName = new Map<SrjConnectionName, SrjConnectionName>()
  const connections = [...groups.values()].map((group) => {
    const canonical =
      group.find((connection) => busMembers.has(connection.name)) ?? group[0]!
    for (const connection of group)
      canonicalByName.set(connection.name, canonical.name)
    connectivity.addConnections([group.map((connection) => connection.name)])
    if (group.length === 1) return canonical
    const width = Math.max(
      ...group.map(
        (connection) =>
          connection.nominalTraceWidth ??
          connection.width ??
          input.minTraceWidth,
      ),
    )
    return {
      ...canonical,
      nominalTraceWidth: width,
      ...(canonical.width === undefined ? {} : { width }),
      mergedConnectionNames: [
        ...new Set(
          group.flatMap((connection) => [
            connection.name,
            ...(connection.mergedConnectionNames ?? []),
          ]),
        ),
      ],
    }
  })
  const canonicalNamesByNet = new Map<ElectricalNet, Set<SrjConnectionName>>()
  for (const connection of connections) {
    const net = connectivity.getNetConnectedToId(connection.name)
    if (!net) throw new Error("A bus lane lost its electrical identity")
    const names = canonicalNamesByNet.get(net) ?? new Set<SrjConnectionName>()
    names.add(connection.name)
    canonicalNamesByNet.set(net, names)
  }
  const canonicalOwner = (
    ids: readonly string[],
  ): SrjConnectionName | undefined => {
    for (const id of ids) {
      const net = connectivity.getNetConnectedToId(id)
      const names = net ? canonicalNamesByNet.get(net) : undefined
      if (names?.size === 1) return [...names][0]
    }
  }
  return {
    ...input,
    connections,
    buses: input.buses?.map((bus) => ({
      ...bus,
      connectionNames: [
        ...new Set(
          bus.connectionNames.map((name) => canonicalByName.get(name) ?? name),
        ),
      ],
    })),
    differentialPairs: input.differentialPairs?.map((pair) => ({
      ...pair,
      connectionNames: [
        canonicalByName.get(pair.connectionNames[0]) ?? pair.connectionNames[0],
        canonicalByName.get(pair.connectionNames[1]) ?? pair.connectionNames[1],
      ],
    })),
    obstacles: input.obstacles.map((obstacle) => {
      const owner = canonicalOwner(obstacle.connectedTo)
      return owner && !obstacle.connectedTo.includes(owner)
        ? { ...obstacle, connectedTo: [...obstacle.connectedTo, owner] }
        : obstacle
    }),
    traces: input.traces?.map((trace) => {
      const owner = canonicalOwner(
        [trace.connection_name, ...(trace.connectsTo ?? [])].filter(
          (id): id is string => Boolean(id),
        ),
      )
      return owner && trace.connection_name !== owner
        ? { ...trace, connection_name: owner }
        : trace
    }),
  }
}
