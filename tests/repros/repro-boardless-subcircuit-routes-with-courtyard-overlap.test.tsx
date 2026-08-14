import { expect, test } from "bun:test"
import { runAllPlacementChecks } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boardless subcircuit autoroutes despite a courtyard overlap", async () => {
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
        text="BUG: OVERLAP STILL ROUTED"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbY={-0.45} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbY={0.45} />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </group>,
  )

  await circuit.renderUntilSettled()

  const placementErrors = (
    await runAllPlacementChecks(circuit.getCircuitJson())
  ).filter((element) => element.type.endsWith("_error"))

  expect(placementErrors.map((element) => element.type)).toContain(
    "pcb_courtyard_overlap_error",
  )
  expect(autoroutingStartCount).toBe(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
