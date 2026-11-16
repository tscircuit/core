import { expect, test } from "bun:test"
import { withPendingRoutingAccessOnSrj } from "lib/components/primitive-components/Group/get-pending-routing-access"
import type {
  PendingRoutingAccess,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"

test("no future work preserves request shape and removes stale inherited intent", () => {
  const sourceSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [{ name: "active", pointsToConnect: [] }],
  }
  const originalSrj = JSON.stringify(sourceSrj)
  const withoutFuture = withPendingRoutingAccessOnSrj(sourceSrj, undefined)
  expect(withoutFuture).toStrictEqual(sourceSrj)
  expect(withoutFuture).not.toHaveProperty("pendingRoutingAccess")
  expect(Object.hasOwn(withoutFuture, "pendingRoutingAccess")).toBe(false)
  expect(JSON.stringify(withoutFuture)).toBe(originalSrj)

  const oldAccess: PendingRoutingAccess[] = [
    {
      bounds: sourceSrj.bounds,
      minTraceWidth: 0.1,
      connections: [{ name: "already_routed", pointsToConnect: [] }],
    },
  ]
  const staleSrj = { ...sourceSrj, pendingRoutingAccess: oldAccess }
  const cleared = withPendingRoutingAccessOnSrj(staleSrj, undefined)
  expect(cleared).toStrictEqual(sourceSrj)
  expect(cleared).not.toHaveProperty("pendingRoutingAccess")
  expect(Object.hasOwn(cleared, "pendingRoutingAccess")).toBe(false)
  expect(JSON.stringify(cleared)).toBe(originalSrj)
  expect(staleSrj.pendingRoutingAccess).toBe(oldAccess)

  const empty = withPendingRoutingAccessOnSrj(staleSrj, [])
  expect(empty).not.toHaveProperty("pendingRoutingAccess")
  expect(JSON.stringify(empty)).toBe(originalSrj)

  const futureAccess: PendingRoutingAccess[] = [
    {
      bounds: sourceSrj.bounds,
      minTraceWidth: 0.1,
      connections: [{ name: "future", pointsToConnect: [] }],
    },
  ]
  const replaced = withPendingRoutingAccessOnSrj(staleSrj, futureAccess)
  expect(replaced.pendingRoutingAccess).toBe(futureAccess)
  expect(JSON.parse(JSON.stringify(replaced)).pendingRoutingAccess).toEqual(
    futureAccess,
  )
  expect(staleSrj.pendingRoutingAccess).toBe(oldAccess)
  expect(sourceSrj).not.toHaveProperty("pendingRoutingAccess")
  expect(JSON.stringify(sourceSrj)).toBe(originalSrj)
})
