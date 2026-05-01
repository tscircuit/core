import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Debug from "debug"
import { XiaoBoard } from "@tscircuit/common"
import { RP2040 } from "../fixtures/assets/RP2040.tsx"

test("xiao board rp2040 pcb packing", async () => {
  // Enable debug logging for pack input
  // Debug.enable("Group_doInitialPcbLayoutPack")

  const { circuit } = getTestFixture()

  circuit.add(
    <XiaoBoard name="U1" variant="RP2040" withPlatedHoles>
      <group packPlacementStrategy="shortest_connection_along_outline">
        <RP2040
          name="U3"
          pcbX={0}
          pcbY={0}
          connections={{
            IOVDD1: ["C5.pin1", "net.V3_3"],
            DVDD1: ["C2.pin1", "net.V1_1"],
            DVDD2: ["C3.pin1", "net.V1_1"],
            GPIO11: ["C4.pin1"],

            USB_VDD: "net.USB_VDD",
            USB_DM: "net.USB_N",
            USB_DP: "net.USB_P",

            GND: "net.GND",
          }}
        />
        <capacitor name="C5" capacitance="10uF" footprint="cap0402" />
        <capacitor name="C2" capacitance="100nF" footprint="cap0201" />
        <capacitor name="C3" capacitance="100nF" footprint="cap0201" />
        <capacitor name="C4" capacitance="100nF" footprint="cap0201" />
      </group>
    </XiaoBoard>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
