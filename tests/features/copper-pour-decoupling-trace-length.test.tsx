import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ground pour does not require a nearby ground port for a constrained capacitor", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <pcbnotetext
        text="GROUND POUR ACCEPTS SHORT CAP TRACE"
        pcbY={-4}
        fontSize={0.55}
      />
      <copperpour connectsTo="net.GND" layer="top" />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        maxDecouplingTraceLength="1mm"
        pcbX={-4}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".R1 > .pin1" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStartCount).toBeGreaterThan(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
