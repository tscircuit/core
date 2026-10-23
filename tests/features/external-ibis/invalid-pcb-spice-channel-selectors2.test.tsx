import { expect, test } from "bun:test"
import { getPcbSpiceChannelSelectorFixture } from "tests/fixtures/get-pcb-spice-channel-selector-fixture"

test("PCB SPICE channel rejects an ambiguous receiver pin", async () => {
  const { circuit } = getPcbSpiceChannelSelectorFixture({
    lanes: [{ name: "DQ0", from: ".U1 > .pin1", to: ".pin1" }],
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    /selector|same subcircuit/,
  )
})
