import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import USBCFlashlight from "./UsbCFlashlight"

test("repro10-usbc-flashlight-pcb", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<USBCFlashlight />)

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
