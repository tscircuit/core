import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting is skipped when straight-line distance exceeds maxLength", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width="16mm"
      height="8mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <pcbnotetext
        pcbY={-3}
        fontSize={0.7}
        text="IMPOSSIBLE TRACE LENGTH: ROUTING SKIPPED"
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        maxDecouplingTraceLength={2}
        pcbX={-4}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} />
      <trace from=".C1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin1" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toContain("cannot be satisfied")
  expect(autoroutingErrors[0].message).toContain("endpoints are")
  expect(autoroutingErrors[0].message).toContain("max_length is")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
