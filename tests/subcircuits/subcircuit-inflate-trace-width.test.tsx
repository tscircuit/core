import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Test that trace width is preserved when inflating a subcircuit from circuit JSON.
 * This test creates a circuit with a custom trace width using pcbStraightLine,
 * renders it to circuit JSON, then inflates that JSON in a new subcircuit
 * and verifies the trace width is preserved.
 */
test("trace width should be preserved when inflating from circuitJson", async () => {
  // First, render a circuit with custom trace width to get circuit JSON
  // Using pcbStraightLine to ensure the explicit thickness is used
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="2k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 .pin2" to=".R2 .pin1" thickness={0.5} pcbStraightLine />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  // Verify source circuit has no errors
  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceErrors = sourceJson.filter((elm) => elm.type.includes("error"))
  expect(sourceErrors).toHaveLength(0)

  // Verify the source trace has the correct width (0.5mm)
  const sourceTraces = sourceJson.filter(
    (elm) => elm.type === "pcb_trace",
  ) as any[]
  expect(sourceTraces.length).toBeGreaterThan(0)

  const sourceTraceWidth = sourceTraces[0].route.find(
    (pt: any) => pt.route_type === "wire",
  )?.width
  expect(sourceTraceWidth).toBe(0.5)

  // Snapshot the original circuit
  expect(sourceCircuit).toMatchPcbSnapshot(`${import.meta.path}-original`)

  // Now inflate the circuit JSON in a new subcircuit
  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="20mm" height="10mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  // Check for errors
  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  // Verify the inflated trace has the same width
  const targetTraces = targetJson.filter(
    (elm) => elm.type === "pcb_trace",
  ) as any[]
  expect(targetTraces.length).toBeGreaterThan(0)

  const targetTraceWidth = targetTraces[0].route.find(
    (pt: any) => pt.route_type === "wire",
  )?.width
  expect(targetTraceWidth).toBe(0.5)

  // Snapshot the inflated circuit - should look the same as original
  expect(targetCircuit).toMatchPcbSnapshot(`${import.meta.path}-inflated`)
})
