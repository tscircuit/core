import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("basic preflight blocks courtyard errors before starting the router", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      preflightRoutingCheckPolicy="basic"
      width="12mm"
      height="8mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <pcbnotetext
        pcbY={-3}
        fontSize={0.7}
        text="PLACEMENT ERROR: ROUTING SKIPPED"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={-0.45}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={0.45}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_preflight_routing_error.list()
  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_courtyard_overlap_error.list().length).toBeGreaterThan(
    0,
  )
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].error_code).toBe("placement_errors")
  expect(autoroutingErrors[0].message).toContain("Routing preflight blocked")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
