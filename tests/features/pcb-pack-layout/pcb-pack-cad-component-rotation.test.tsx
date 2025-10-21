import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Debug from "debug"
import { XiaoBoard } from "@tscircuit/common"
import { RP2040 } from "../../fixtures/assets/RP2040.tsx"

test("xiao board rp2040 pcb packing", async () => {
  // Enable debug logging for pack input
  // Debug.enable("Group_doInitialPcbLayoutPack")

  const { circuit } = getTestFixture()

  circuit.add(
    <XiaoBoard name="U1" variant="RP2040" withPlatedHoles>
      <RP2040 name="U3" />
      <capacitor name="C2" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C3" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C7" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C10" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C15" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C18" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C21" capacitance="100nF" footprint="cap0201" />

      <capacitor name="C5" capacitance="10uF" footprint="cap0402" />
      <capacitor name="C6" capacitance="10uF" footprint="cap0402" />

      <capacitor name="C16" capacitance="1uF" footprint="cap0201" />

      <capacitor name="C19" capacitance="12pF" footprint="cap0201" />
      <capacitor name="C20" capacitance="12pF" footprint="cap0201" />
    </XiaoBoard>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
