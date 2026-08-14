import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boardless subcircuit skips autorouting for a courtyard overlap", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <group subcircuit name="S1" autorouter="default">
      <pcbnotetext
        pcbY={-2.5}
        fontSize={0.35}
        text="PLACEMENT ERROR: ROUTING SKIPPED"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbY={-0.45} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbY={0.45} />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </group>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_courtyard_overlap_error.list().length).toBeGreaterThan(
    0,
  )
  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
