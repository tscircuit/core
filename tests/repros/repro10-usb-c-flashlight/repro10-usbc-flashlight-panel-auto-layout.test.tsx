import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import USBCFlashlight from "./UsbCFlashlight"

test.skip("Panel auto-layout repro10-usbc-flashlight-pcb", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width={100} height={100} layoutMode="grid">
      <USBCFlashlight />
      <USBCFlashlight />
      <USBCFlashlight />
      <USBCFlashlight />
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
