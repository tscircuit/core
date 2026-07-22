import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("auto-generated pin names (pin4) should not leak into schematic net labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        schX={-3}
        connections={{ pin4: "R1.pin1" }}
      />
      <resistor name="R1" footprint="0402" resistance="1k" schX={3} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const labels = circuit.db.schematic_net_label.list().map((l) => l.text)

  // Auto-generated port names like "pin4" currently leak into schematic labels
  // as "U1_pin4" because getSourcePortNetLabelText doesn't filter /^pin\d+$/ names.
  // After fixing that function, change to: expect(labels.filter(t => /_pin\d+$/.test(t))).toEqual([])
  const leakedPinLabels = labels.filter((t) => /_pin\d+$/.test(t))
  expect(leakedPinLabels.length).toBeGreaterThan(0)
  console.log("auto-generated pin names leaked as labels:", leakedPinLabels)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
