import { expect, test } from "bun:test"
import { getPcbSpiceChannelSelectorFixture } from "tests/fixtures/get-pcb-spice-channel-selector-fixture"

test("PCB SPICE channel rejects a missing passive component", async () => {
  const { circuit } = getPcbSpiceChannelSelectorFixture({
    passiveComponentRefs: [".missing"],
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    /selector|same subcircuit/,
  )
})
