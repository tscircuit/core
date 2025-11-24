import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import USBCFlashlight from "./UsbCFlashlight"
import type { AutoroutingStartEvent } from "lib/events"

test("repro10-usbc-flashlight-pcb", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width={100} height={100}>
      <USBCFlashlight />
      <USBCFlashlight />
      <USBCFlashlight />
      <USBCFlashlight />
    </panel>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
