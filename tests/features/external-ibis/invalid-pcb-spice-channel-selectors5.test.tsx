import { expect, test } from "bun:test"
import { getPcbSpiceChannelSelectorFixture } from "tests/fixtures/get-pcb-spice-channel-selector-fixture"

test("PCB SPICE channel rejects an ambiguous passive component", async () => {
  const { circuit } = getPcbSpiceChannelSelectorFixture({
    passiveComponentRefs: ["chip"],
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    /selector|same subcircuit/,
  )
})
