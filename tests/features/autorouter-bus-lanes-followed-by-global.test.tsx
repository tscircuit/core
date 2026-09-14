import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("global routing preserves the completed selected bus phase", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board width={16} height={12}>
      <autoroutingphase
        name="DDR"
        phaseIndex={0}
        autorouter={{ preset: "bus_lanes" }}
        connections={["A.pin2"]}
      />
      <resistor name="A" resistance="1k" footprint="0402" pcbX={-4} pcbY={-2} />
      <resistor name="B" resistance="1k" footprint="0402" pcbX={4} pcbY={-2} />
      <resistor name="C" resistance="1k" footprint="0402" pcbX={-4} pcbY={2} />
      <resistor name="D" resistance="1k" footprint="0402" pcbX={4} pcbY={2} />
      <trace name="DDR_DATA" from=".A > .pin2" to=".B > .pin1" />
      <trace name="GPIO" from=".C > .pin2" to=".D > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const ddrSourceTrace = json
    .filter((e) => e.type === "source_trace")
    .find((e) => e.name === "DDR_DATA")!
  expect(inputs).toHaveLength(2)
  expect(inputs[0].connections.map((c) => c.source_trace_id)).toEqual([
    ddrSourceTrace.source_trace_id,
  ])
  expect(
    inputs[1].connections.some(
      (c) => c.source_trace_id === ddrSourceTrace.source_trace_id,
    ),
  ).toBe(false)
  const fixedDdr = inputs[1].traces!.find(
    (t) => t.connection_name === inputs[0].connections[0].name,
  )!
  expect(fixedDdr).toBeDefined()
  const finalDdr = json
    .filter((e) => e.type === "pcb_trace")
    .find((e) => e.source_trace_id === ddrSourceTrace.source_trace_id)!
  expect(finalDdr.route).toHaveLength(fixedDdr.route.length)
  expect(finalDdr.route).toMatchObject(fixedDdr.route)
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(2)
  expect(json.filter((e) => e.type.includes("error"))).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
