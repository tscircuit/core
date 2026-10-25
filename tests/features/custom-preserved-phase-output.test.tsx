import { expect, test, spyOn } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("capacity router keeps completed phase copper immutable with compact oriented obstacles", async () => {
  const { circuit } = getTestFixture()
  let firstTrace: SimplifiedPcbTrace | undefined,
    secondInput: SimpleRouteJson | undefined
  const start = TscircuitAutorouter.prototype.start
  const spy = spyOn(TscircuitAutorouter.prototype, "start").mockImplementation(
    function (this: TscircuitAutorouter) {
      secondInput = this.input
      return start.call(this)
    },
  )
  try {
    const first = createBasicAutorouter(async (input) =>
      input.connections.map((c) => {
        const [a, b] = c.pointsToConnect,
          width = c.nominalTraceWidth ?? 0.15
        const wire = (x: number, y: number) => ({
          route_type: "wire" as const,
          x,
          y,
          width,
          layer: a.layer,
        })
        firstTrace = {
          type: "pcb_trace",
          pcb_trace_id: `native_${c.name}`,
          connection_name: c.name,
          route: [
            wire(a.x, a.y),
            wire(a.x + 1, a.y + 1),
            wire(b.x - 1, b.y + 1),
            wire(b.x, b.y),
          ],
        }
        return firstTrace
      }),
    )
    circuit.add(
      <board width={18} height={10}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={2} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={6} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={1} />
        <trace from=".R3 > .pin1" to=".R4 > .pin1" routingPhaseIndex={2} />
        <autoroutingphase
          phaseIndex={1}
          name="preserved-custom"
          autorouter="bus_lanes"
          algorithmFn={first}
        />
        <autoroutingphase phaseIndex={2} name="following-capacity" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(2)
    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(secondInput).toBeDefined()
    expect(firstTrace).toBeDefined()
    expect(secondInput!.traces ?? []).toHaveLength(0)
    const fixedObstacles = secondInput!.obstacles.filter((obstacle) =>
      obstacle.obstacleId?.startsWith(
        `trace_obstacle_fixed_${firstTrace!.pcb_trace_id}_`,
      ),
    )
    expect(fixedObstacles).toHaveLength(3)
    expect(
      fixedObstacles.map((obstacle) => obstacle.ccwRotationDegrees),
    ).toEqual([45, 0, -45])
    const emitted = circuit.db.pcb_trace
      .list()
      .find((t) => t.source_trace_id === firstTrace!.connection_name)
    const geometry = (route: any[]) =>
      route.map((p) => ({
        type: p.route_type,
        x: p.x,
        y: p.y,
        width: p.width,
        layer: p.layer,
      }))
    expect(emitted).toBeDefined()
    expect(geometry(emitted!.route)).toEqual(geometry(firstTrace!.route))
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    spy.mockRestore()
  }
}, 60_000)
