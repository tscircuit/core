import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two-pad USB net selectors route with explicit lane skew", async () => {
  const { circuit } = getTestFixture()
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
        name="USB"
        maxLengthSkew={0.1}
        positiveConnection="net.USB_DP"
        negativeConnection="net.USB_DM"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })

  // Two-pad selectors normalize to exact owned source hops.
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
})
