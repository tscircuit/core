import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("differential pair over nets is routed", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  const asyncErrors: string[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  const usb = { DP: "net.USB_DP", DM: "net.USB_DM" }

  circuit.add(
    <board width={18} height={10} schematicDisabled>
      <connector
        name="J1"
        footprint="usbmicro"
        pcbX={-6}
        pcbRotation={270}
        pinLabels={{ pin2: "DM", pin3: "DP" }}
        connections={usb}
      />
      <chip
        name="MCU"
        footprint="soic8"
        pcbX={6}
        pinLabels={{ pin2: "DM", pin3: "DP" }}
        connections={usb}
      />
      <differentialpair
        positiveConnection="net.USB_DP"
        negativeConnection="net.USB_DM"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncErrors).toEqual([])
  expect(inputs).toHaveLength(1)
  expect(inputs[0].differentialPairs).toEqual([
    {
      connectionNames: [
        circuit.db.source_net.getWhere({ name: "USB_DP" })!.source_net_id,
        circuit.db.source_net.getWhere({ name: "USB_DM" })!.source_net_id,
      ],
      lengthTolerance: 0.1,
    },
  ])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
