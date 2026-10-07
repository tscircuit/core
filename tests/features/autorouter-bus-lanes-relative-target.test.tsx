import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("bus_lanes resolves a relative target from the declared endpoint pads", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board width={24} height={14} schematicDisabled routeRemaining={false}>
      <LengthTestTerminal name="TX" x={-6} y={-1} />
      <LengthTestTerminal name="RX" x={6} y={1} />
      <trace name="D0" from="TX.pin1" to="RX.pin1" />
      <bus
        name="DATA"
        connections={["D0"]}
        routingPhaseIndex={0}
        targetLength={{
          reference: "longest_manhattan",
          of: ["TX.pin1"],
          offset: "1mm",
        }}
        lengthTolerance="0.5mm"
      />
      <autoroutingphase phaseIndex={0} autorouter="bus_lanes" />
      <pcbnotetext
        text="14 mm endpoint Manhattan + 1 mm = 15 +/-0.5 mm"
        pcbY={5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(inputs[0].buses?.[0]).toMatchObject({
    minLength: 14.5,
    maxLength: 15.5,
  })
  expect(circuit.db.source_bus.list()[0].target_length).toEqual({
    reference: "longest_manhattan",
    source_trace_ids: [circuit.db.source_trace.list()[0].source_trace_id],
    offset: 1,
  })
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
