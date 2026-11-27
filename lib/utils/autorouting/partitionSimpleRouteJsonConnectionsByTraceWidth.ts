import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SingleLayerConnectionPoint,
} from "./SimpleRouteJson"

const WIDTH_EPSILON = 1e-6

function getConnectionPointKeys(point: SingleLayerConnectionPoint): string[] {
  const keys: string[] = []
  if (point.pointId) {
    keys.push(`id:${point.pointId}`)
  }
  if (point.pcb_port_id) {
    keys.push(`port:${point.pcb_port_id}`)
  }
  keys.push(`xy:${point.layer}:${point.x.toFixed(4)}:${point.y.toFixed(4)}`)
  return keys
}

function getEffectiveWidth(
  connection: SimpleRouteConnection,
  defaultWidth: number,
): number {
  return connection.nominalTraceWidth ?? connection.width ?? defaultWidth
}

/**
 * Capacity-autorouter merges connections that touch a shared point into a
 * single MST connection with one `nominalTraceWidth`. When a net contains both
 * an explicit-thickness `<trace>` and other traces/net branches of a different
 * width, partitioning that net's connections by width (routing explicit trace
 * connections first and passing their routed copper into the residual pass)
 * preserves each trace's requested width without altering single-width nets.
 */
export function partitionSimpleRouteJsonConnectionsByTraceWidth(
  simpleRouteJson: SimpleRouteJson,
): SimpleRouteConnection[][] {
  const { connections } = simpleRouteJson
  if (connections.length <= 1) return [connections]

  const n = connections.length
  const netParent = Array.from({ length: n }, (_, i) => i)
  const findNet = (x: number): number => {
    let r = x
    while (netParent[r] !== r) r = netParent[r]!
    let cur = x
    while (cur !== r) {
      const next = netParent[cur]!
      netParent[cur] = r
      cur = next
    }
    return r
  }
  const unionNet = (a: number, b: number) => {
    const ra = findNet(a)
    const rb = findNet(b)
    if (ra !== rb) netParent[rb] = ra
  }

  const indexByPointKey = new Map<string, number>()
  const indexByConnectionName = new Map<string, number>()
  for (let i = 0; i < n; i++) {
    const conn = connections[i]!
    indexByConnectionName.set(conn.name, i)
    for (const point of conn.pointsToConnect) {
      for (const key of getConnectionPointKeys(point)) {
        const prev = indexByPointKey.get(key)
        if (prev !== undefined) unionNet(prev, i)
        else indexByPointKey.set(key, i)
      }
    }
  }

  // Also link obstacle-shared nets (e.g. two pads internally connected or
  // sharing a source_net ID in obstacle.connectedTo).
  for (const obstacle of simpleRouteJson.obstacles) {
    let firstConnIndex: number | undefined
    for (const id of obstacle.connectedTo) {
      const idx =
        indexByConnectionName.get(id) ??
        indexByPointKey.get(`id:${id}`) ??
        indexByPointKey.get(`port:${id}`)
      if (idx === undefined) continue
      if (firstConnIndex === undefined) firstConnIndex = idx
      else unionNet(firstConnIndex, idx)
    }
  }

  for (let i = 0; i < n; i++) {
    const netName = connections[i]!.netConnectionName
    if (!netName) continue
    const netIdx = indexByConnectionName.get(netName)
    if (netIdx !== undefined) unionNet(i, netIdx)
  }

  // Differential pairs and buses must stay within a single pass.
  const lockedSamePass = new Set<number>()
  for (const pair of simpleRouteJson.differentialPairs ?? []) {
    for (const name of pair.connectionNames) {
      const idx = indexByConnectionName.get(name)
      if (idx !== undefined) lockedSamePass.add(findNet(idx))
    }
  }
  for (const bus of simpleRouteJson.buses ?? []) {
    for (const name of bus.connectionNames) {
      const idx = indexByConnectionName.get(name)
      if (idx !== undefined) lockedSamePass.add(findNet(idx))
    }
  }

  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const root = findNet(i)
    const list = groups.get(root)
    if (list) list.push(i)
    else groups.set(root, [i])
  }

  const defaultWidth = simpleRouteJson.minTraceWidth
  let hasMixedWidthGroup = false
  for (const [root, indices] of groups) {
    if (indices.length <= 1 || lockedSamePass.has(root)) continue
    const firstWidth = getEffectiveWidth(
      connections[indices[0]!]!,
      defaultWidth,
    )
    if (
      indices.some(
        (idx) =>
          Math.abs(
            getEffectiveWidth(connections[idx]!, defaultWidth) - firstWidth,
          ) > WIDTH_EPSILON,
      )
    ) {
      hasMixedWidthGroup = true
      break
    }
  }

  if (!hasMixedWidthGroup) return [connections]

  const tierByConnectionIndex = new Array<number>(n).fill(0)
  let maxTier = 0

  for (const [root, indices] of groups) {
    if (indices.length <= 1 || lockedSamePass.has(root)) continue
    const firstWidth = getEffectiveWidth(
      connections[indices[0]!]!,
      defaultWidth,
    )
    const isMixed = indices.some(
      (idx) =>
        Math.abs(
          getEffectiveWidth(connections[idx]!, defaultWidth) - firstWidth,
        ) > WIDTH_EPSILON,
    )
    if (!isMixed) continue

    // Route explicit source_trace connections before net-level connections, and
    // wider explicit widths before narrower ones.
    const sorted = [...indices].sort((a, b) => {
      const connA = connections[a]!
      const connB = connections[b]!
      const isNetA = connA.source_trace_id === undefined ? 1 : 0
      const isNetB = connB.source_trace_id === undefined ? 1 : 0
      if (isNetA !== isNetB) return isNetA - isNetB
      return (
        getEffectiveWidth(connB, defaultWidth) -
        getEffectiveWidth(connA, defaultWidth)
      )
    })

    let currentTier = 0
    for (let k = 0; k < sorted.length; k++) {
      const idx = sorted[k]!
      if (k > 0) {
        const prevConn = connections[sorted[k - 1]!]!
        const curConn = connections[idx]!
        const prevIsNet = prevConn.source_trace_id === undefined
        const curIsNet = curConn.source_trace_id === undefined
        const prevWidth = getEffectiveWidth(prevConn, defaultWidth)
        const curWidth = getEffectiveWidth(curConn, defaultWidth)
        if (
          prevIsNet !== curIsNet ||
          Math.abs(prevWidth - curWidth) > WIDTH_EPSILON
        ) {
          currentTier++
        }
      }
      tierByConnectionIndex[idx] = currentTier
      if (currentTier > maxTier) maxTier = currentTier
    }
  }

  const passes: SimpleRouteConnection[][] = Array.from(
    { length: maxTier + 1 },
    () => [],
  )
  for (let i = 0; i < n; i++) {
    passes[tierByConnectionIndex[i]!]!.push(connections[i]!)
  }
  return passes.filter((pass) => pass.length > 0)
}
