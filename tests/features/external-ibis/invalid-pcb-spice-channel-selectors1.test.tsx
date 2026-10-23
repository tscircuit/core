import { expect, test } from "bun:test"
import { getPcbSpiceChannelSelectorFixture } from "tests/fixtures/get-pcb-spice-channel-selector-fixture"

test("PCB SPICE channel rejects a missing driver pin", async () => {
  const { circuit } = getPcbSpiceChannelSelectorFixture({
    lanes: [{ name: "DQ0", from: ".missing", to: ".U2 > .pin1" }],
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    /selector|same subcircuit/,
  )
})
