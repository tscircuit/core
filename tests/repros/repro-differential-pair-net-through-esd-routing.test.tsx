import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// The autorouter cannot yet pair multi-segment nets
// (tscircuit/tscircuit-autorouter#3654). Remove .failing and add a PCB
// snapshot when core bumps to a release containing that fix.
test.failing(
  "differential pair over nets routes through an ESD chip",
  async () => {
    const { circuit } = getTestFixture()
    const asyncErrors: string[] = []
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
          name="ESD"
          footprint="sot23"
          pinLabels={{ pin1: "DM", pin2: "DP" }}
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
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  },
)
