import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { RP2040 } from "tests/fixtures/assets/RP2040"

const RPBoard = () => {
  return (
    <>
      <RP2040
        name="U3"
        connections={{
          IOVDD1: ["C12.pin1", "net.V3_3"],
          IOVDD2: ["C14.pin1", "net.V3_3"],
          IOVDD3: ["C8.pin1", "net.V3_3"],
          IOVDD4: ["C13.pin1", "net.V3_3"],
          IOVDD5: ["C15.pin1", "net.V3_3"],
          IOVDD6: ["C19.pin1", "net.V3_3"],

          DVDD1: ["C18.1", "net.V1_1"],
          DVDD2: ["C7.1", "net.V1_1"],

          USB_VDD: "net.USB_VDD",
          USB_DM: "net.USB_N",
          USB_DP: "net.USB_P",

          GND: "net.GND",
        }}
      />
      <capacitor name="C5" capacitance="10uF" footprint="cap0402" />
      <capacitor name="C2" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C3" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C7" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C10" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C15" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C18" capacitance="100nF" footprint="cap0201" />
      <capacitor name="C21" capacitance="100nF" footprint="cap0201" />
    </>
  )
}

test("repro74: board inside panel", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="70mm" height="50mm" pcbX={0} pcbY={0}>
      <board width="25mm" height="25mm">
        <RPBoard />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
test("repro74: standalone board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="25mm">
      <RPBoard />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-no-panel")
})
