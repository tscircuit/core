import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("board DRC reports an absolute target miss on a complete saved route", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={12} schematicDisabled routeRemaining={false}>
      <LengthTestTerminal name="TX" x={-10} y={0} />
      <LengthTestTerminal name="RX" x={10} y={0} />
      <trace
        name="D0"
        from="TX.pin1"
        to="RX.pin1"
        pcbPathRelativeTo="TX.pin1"
        pcbPath={[
          { x: 0, y: 0 },
          { x: 20, y: 0 },
        ]}
      />
      <bus
        name="DATA"
        connections={["D0"]}
        targetLength="25mm"
        lengthTolerance="0.5mm"
      />
      <pcbnotetext
        text="D0 is 20 mm: violates 25 +/-0.5 mm target"
        pcbY={4}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_bus_routing_constraint_error.list()).toMatchObject([
    {
      routing_rule: "target_length",
      actual_trace_length: 20,
      length_tolerance: 0.5,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
