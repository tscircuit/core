import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Reproduction test for pcb_missing_footprint_error during circuit JSON inflation.
 *
 * When a subcircuit with circuitJson prop (or cached subcircuit) is inflated,
 * components like resistors and capacitors may produce pcb_missing_footprint_error
 * even though their footprint primitives (pads, etc.) are present in the circuit JSON.
 */
test("inflation of resistor from circuitJson should not produce missing footprint error", async () => {
  // First, render a simple circuit to get valid circuit JSON
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  // Verify source circuit has no errors
  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceErrors = sourceJson.filter((elm) => elm.type.includes("error"))
  expect(sourceErrors).toHaveLength(0)

  // Now use that circuit JSON in a subcircuit via the circuitJson prop
  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  // Check for errors - this is where the pcb_missing_footprint_error appears
  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))

  console.log("Errors after inflation:", targetErrors)

  // There should be no missing footprint errors
  const missingFootprintErrors = targetErrors.filter(
    (e) => e.type === "pcb_missing_footprint_error",
  )
  expect(missingFootprintErrors).toHaveLength(0)
})

test("inflation of capacitor from circuitJson should not produce missing footprint error", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceErrors = sourceJson.filter((elm) => elm.type.includes("error"))
  expect(sourceErrors).toHaveLength(0)

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))

  console.log("Errors after inflation:", targetErrors)

  const missingFootprintErrors = targetErrors.filter(
    (e) => e.type === "pcb_missing_footprint_error",
  )
  expect(missingFootprintErrors).toHaveLength(0)
})

test("inflation of multiple components from circuitJson should not produce missing footprint errors", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={5}
        pcbY={0}
      />
      <trace from=".R1 .pin1" to=".C1 .pin1" />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceErrors = sourceJson.filter((elm) => elm.type.includes("error"))
  expect(sourceErrors).toHaveLength(0)

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="30mm" height="30mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))

  console.log("Errors after inflation:", targetErrors)

  const missingFootprintErrors = targetErrors.filter(
    (e) => e.type === "pcb_missing_footprint_error",
  )
  expect(missingFootprintErrors).toHaveLength(0)
})
