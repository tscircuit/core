import { expect, test } from "bun:test"
import { getPcbSpiceChannelSelectorFixture } from "tests/fixtures/get-pcb-spice-channel-selector-fixture"

test("PCB SPICE channel rejects a reference pin in another subcircuit", async () => {
  const { circuit } = getPcbSpiceChannelSelectorFixture({
    referencePinRef: ".nested > .RREMOTE > .pin1",
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    /selector|same subcircuit/,
  )
})
