import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import USBCFlashlight from "./UsbCFlashlight"
import type { AutoroutingStartEvent } from "lib/events"

test("panel autolayout, usbc-flashlight-pcb + other board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width={100} height={100}>
      <USBCFlashlight pcbX={20} pcbY={20} />
      <USBCFlashlight pcbX={-20} pcbY={20} />
      <USBCFlashlight pcbX={20} pcbY={-20} />
      <board pcbX={-20} pcbY={-20} width={15} height={40}>
        <resistor resistance={"1k"} name="R1" footprint={"0402"} pcbX={-5} />
        <capacitor capacitance={"10"} name="C1" footprint={"0402"} />
        <trace from=".R1 < .pin1" to=".C1 < .pin1" />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
