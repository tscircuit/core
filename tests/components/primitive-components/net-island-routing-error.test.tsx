import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net island routing errors are handled gracefully", () => {
  const { circuit } = getTestFixture()

  // Create a board with components connected by nets in a way that makes some
  // connections impossible to route (due to obstacles and spacing)
  circuit.add(
    <board width="20mm" height="20mm">
      {/* Create a wall around the center component */}
      <chip
        name="WALL1"
        footprint="quad4_w3_h3_pw3_pl0.1"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
      />
      <chip
        name="WALL2"
        layer="bottom"
        footprint="quad4_w3_h3_pw3_pl0.1"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
      />

      {/* Components on either side trying to connect through the wall */}
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />

      {/* Connect components through nets */}
      <trace from=".R1 > .pin1" to="net.NET1" />
      <trace from=".R1 > .pin2" to="net.NET1" />
      <trace from=".R2 > .pin1" to="net.NET1" />
      <trace from=".R2 > .pin2" to="net.NET1" />
    </board>,
  )

  circuit.render()

  // Visual verification
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Verify that trace errors were created
  const traceErrors = circuit.db.pcb_trace_error.list()
  expect(traceErrors.length).toBeGreaterThan(0)

  // Verify error messages
  const errorMessages = traceErrors.map((e) => e.message)
  expect(errorMessages).toContain("Failed to route net islands")

  // Verify that the circuit still rendered despite the errors
  expect(circuit.db.pcb_component.list().length).toBeGreaterThan(0)
})
