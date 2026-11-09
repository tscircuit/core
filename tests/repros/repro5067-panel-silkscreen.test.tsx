import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel silkscreen text can be placed in the panel frame", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" edgePadding="5mm">
      <board name="B1" width="14mm" height="18mm" routingDisabled>
        <pcbnotetext text="Panel silkscreen" fontSize={0.6} />
      </board>
      <silkscreentext text="PANEL A / REV 1" pcbY={12} fontSize={0.8} />
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
  expect(circuit.db.pcb_silkscreen_text.list()).toContainEqual(
    expect.objectContaining({
      text: "PANEL A / REV 1",
      anchor_position: { x: 0, y: 12 },
    }),
  )
})
