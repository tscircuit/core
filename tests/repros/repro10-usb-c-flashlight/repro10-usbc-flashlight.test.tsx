import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import USBCFlashlight from "./UsbCFlashlight"
import type { AutoroutingStartEvent } from "lib/events"

test("repro10-usbc-flashlight-pcb", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<USBCFlashlight />)

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
