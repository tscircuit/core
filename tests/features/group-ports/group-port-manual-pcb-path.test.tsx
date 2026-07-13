import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual PCB paths resolve group-port anchors and waypoints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" autorouter="sequential-trace">
      <subcircuit
        name="FILTER"
        connections={{ IO: "R1.pin1" }}
        showAsSchematicBox
      >
        <port name="IO" direction="left" />
        <resistor name="R1" resistance="10k" footprint="0402" pcbX={2} />
      </subcircuit>
      <resistor name="R13" resistance="10k" footprint="0402" pcbX={-2} />
      <trace
        from="FILTER.IO"
        to="R13.pin2"
        pcbPathRelativeTo=".FILTER > .IO"
        pcbPath={["FILTER.IO", "R13.pin2"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
