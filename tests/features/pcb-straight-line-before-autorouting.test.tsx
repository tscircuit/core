import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbStraightLine copper exists before and is preserved during autorouting", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined
  let initialStraightLine: PcbTrace | undefined
  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    autorouterInput = structuredClone(simpleRouteJson)
    const pcbTraces = circuit.db.pcb_trace.list()
    expect(pcbTraces).toHaveLength(1)
    initialStraightLine = structuredClone(pcbTraces[0])
  })

  circuit.add(
    <board
      width="24mm"
      height="16mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      <resistor
        name="R_FIXED_LEFT"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R_FIXED_RIGHT"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        pcbY={0}
      />
      <trace
        name="FIXED_COPPER"
        from=".R_FIXED_LEFT > .pin2"
        to=".R_FIXED_RIGHT > .pin1"
        thickness="0.3mm"
        pcbStraightLine
      />

      <resistor
        name="R_ROUTE_BOTTOM"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={-5}
        pcbRotation={90}
      />
      <resistor
        name="R_ROUTE_TOP"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={5}
        pcbRotation={90}
      />
      <trace
        name="ROUTE_AROUND_FIXED_COPPER"
        from=".R_ROUTE_BOTTOM > .pin2"
        to=".R_ROUTE_TOP > .pin1"
      />
      <pcbnotetext
        text="pcbStraightLine is fixed before autorouting"
        pcbY={7}
        fontSize="0.35mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autorouterInput).toBeDefined()
  expect(autorouterInput?.connections).toHaveLength(1)
  expect(autorouterInput?.traces ?? []).toHaveLength(0)
  expect(initialStraightLine).toBeDefined()
  expect(initialStraightLine?.route).toHaveLength(2)
  expect(
    autorouterInput?.obstacles.some((obstacle) =>
      obstacle.connectedTo.includes(initialStraightLine!.source_trace_id!),
    ),
  ).toBe(true)
  expect(
    circuit.db.pcb_trace.get(initialStraightLine!.pcb_trace_id)?.route,
  ).toEqual(initialStraightLine?.route)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
