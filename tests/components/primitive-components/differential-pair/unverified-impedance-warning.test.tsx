import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns that a USB impedance target is not signal-integrity verification", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <differentialpair
        name="USB2"
        positiveConnection="USB_DP"
        negativeConnection="USB_DM"
        targetDifferentialImpedance="90ohm"
        pcbTraceGap="0.15mm"
      />
      <resistor name="R1" resistance="22" footprint="0402" />
      <resistor name="R2" resistance="22" footprint="0402" />
      <chip name="U1" footprint="soic8" />
      <trace name="USB_DP" from=".U1 > .pin1" to=".R1 > .pin1" />
      <trace name="USB_DM" from=".U1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const warnings = circuit.db.source_property_ignored_warning
    .list()
    .filter(
      (warning) => warning.property_name === "targetDifferentialImpedance",
    )
  expect(warnings).toHaveLength(1)
  expect(warnings[0]?.message).toContain(
    "does not verify controlled impedance or signal integrity",
  )
})
