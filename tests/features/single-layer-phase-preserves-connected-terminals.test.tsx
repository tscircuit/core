import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a later shared-net phase does not duplicate an already-routed planar connection", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board width={12} height={8} autorouter="auto_local">
      <autoroutingphase
        name="bypass"
        phaseIndex={0}
        autorouter="single_layer_routing"
        connections={["BYPASS"]}
      />
      <resistor name="A" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="B" resistance="1k" footprint="0402" />
      <resistor name="C" resistance="1k" footprint="0402" pcbX={2} pcbY={2} />
      <trace name="BYPASS" from=".A > .pin2" to=".B > .pin1" maxLength={1.1} />
      <trace from=".A > .pin2" to="net.SUPPLY" />
      <trace from=".B > .pin1" to="net.SUPPLY" />
      <trace from=".C > .pin1" to="net.SUPPLY" />
      <pcbnotetext
        pcbY={-2}
        fontSize={0.4}
        text="A-B is routed once, then reused by the shared supply net."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const bypass = json
    .filter((element) => element.type === "source_trace")
    .find((element) => element.name === "BYPASS")!
  const retained = inputs[1]!.traces!.find(
    (trace) => trace.connection_name === bypass.source_trace_id,
  )!
  expect(retained.isFixed).toBe(true)
  expect(retained.connectsTo).toHaveLength(2)
  const bypassTraces = json.filter(
    (element) =>
      element.type === "pcb_trace" &&
      element.source_trace_id === bypass.source_trace_id,
  )
  expect(bypassTraces).toHaveLength(1)
  expect(json.filter((element) => element.type.includes("error"))).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
