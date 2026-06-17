import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Test that fiducial elements are properly inflated when loading a subcircuit
 * from circuit JSON.
 */
test("fiducials should be inflated from circuitJson", async () => {
  // First, render a circuit with fiducials to get circuit JSON
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="20mm">
      <fiducial name="F1" pcbX={2} pcbY={2} padDiameter="2mm" />
      <fiducial
        name="F2"
        pcbX={8}
        pcbY={8}
        padDiameter="3mm"
        soldermaskPullback="0.5mm"
        layer="bottom"
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  // Verify source circuit has no errors
  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceErrors = sourceJson.filter((elm) => elm.type.includes("error"))
  expect(sourceErrors).toHaveLength(0)

  // Verify fiducials exist as pcb_smtpad elements (not source_simple_fiducial)
  const smtpads = sourceJson.filter((elm) => elm.type === "pcb_smtpad")
  expect(smtpads.length).toBe(2)

  const smtpad1 = smtpads[0] as any
  expect(smtpad1.x).toBe(2)
  expect(smtpad1.y).toBe(2)
  expect(smtpad1.radius).toBe(1) // padDiameter 2mm = radius 1mm
  expect(smtpad1.layer).toBe("top")
  expect(smtpad1.shape).toBe("circle")
  expect(smtpad1.is_covered_with_solder_mask).toBe(true)

  const smtpad2 = smtpads[1] as any
  expect(smtpad2.x).toBe(8)
  expect(smtpad2.y).toBe(8)
  expect(smtpad2.radius).toBe(1.5) // padDiameter 3mm = radius 1.5mm
  expect(smtpad2.layer).toBe("bottom")
  expect(smtpad2.soldermask_margin).toBe(0.5)

  // Now inflate the circuit JSON in a new subcircuit
  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  // Check for errors
  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  // Verify fiducials were inflated as pcb_smtpad elements
  const inflatedSmtpads = targetJson.filter((elm) => elm.type === "pcb_smtpad")
  expect(inflatedSmtpads.length).toBe(2)

  // Verify properties are preserved
  const inflatedSmtpad1 = inflatedSmtpads[0] as any
  expect(inflatedSmtpad1.x).toBe(2)
  expect(inflatedSmtpad1.y).toBe(2)
  expect(inflatedSmtpad1.radius).toBe(1)
  expect(inflatedSmtpad1.shape).toBe("circle")

  const inflatedSmtpad2 = inflatedSmtpads[1] as any
  expect(inflatedSmtpad2.x).toBe(8)
  expect(inflatedSmtpad2.y).toBe(8)
  expect(inflatedSmtpad2.radius).toBe(1.5)
  expect(inflatedSmtpad2.layer).toBe("bottom")
})
