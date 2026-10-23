import { expect, test } from "bun:test"
import { getPcbSpiceChannelSelectorFixture } from "tests/fixtures/get-pcb-spice-channel-selector-fixture"

test("PCB SPICE channel rejects a passive component in another subcircuit", async () => {
  const { circuit } = getPcbSpiceChannelSelectorFixture({
    passiveComponentRefs: [".nested > .RREMOTE"],
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    /selector|same subcircuit/,
  )
})
