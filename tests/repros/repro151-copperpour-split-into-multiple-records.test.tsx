import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro151: one copperpour split by a trace creates multiple records", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-9}
        pcbY={-5}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={9} pcbY={-5} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={0} pcbY={5} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R3 > .pin1" to="net.GND" />
      <via
        connectsTo="net.GND"
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        fromLayer="top"
        toLayer="bottom"
        pcbX={0}
        pcbY={-8}
      />
      <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        text="1 COPPERPOUR CREATES 2 RECORDS"
        fontSize={1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
