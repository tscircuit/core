import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Pipeline9 routes around an immutable diagonal solderjumper bridge", async () => {
  const { circuit } = getTestFixture()

  let input: SimpleRouteJson | undefined
  let bridge: PcbTrace | undefined
  circuit.on("autorouting:start", (event) => {
    input = event.simpleRouteJson
    bridge = structuredClone(
      circuit.db.pcb_trace.list().find((trace) => !trace.source_trace_id),
    )
  })
  circuit.add(
    <board width="20mm" height="8mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <solderjumper
        name="JP1"
        footprint="solderjumper2_bridged12"
        bridgedPins={[["1", "2"]]}
        pcbRotation={45}
        pcbY={-1}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />

      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(bridge).toBeDefined()
  expect(
    input!.traces?.find((trace) => trace.pcb_trace_id === bridge!.pcb_trace_id)
      ?.route[0]!.route_type,
  ).toBe("through_obstacle")
  expect(
    input!.obstacles.some(
      (obstacle) => obstacle.connectedTo[0] === bridge!.pcb_trace_id,
    ),
  ).toBe(false)
  expect(circuit.db.pcb_trace.get(bridge!.pcb_trace_id)?.route).toEqual(
    bridge!.route,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
