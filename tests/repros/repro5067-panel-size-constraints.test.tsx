import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel dimensions are checked against manufacturing limits", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" minWidth="50mm" maxHeight="25mm">
      <board width="14mm" height="18mm" routingDisabled>
        <pcbnotetext
          text="Panel below min width / above max height"
          fontSize={0.5}
        />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
  expect(circuit.db.pcb_panel.list()[0]).toMatchObject({
    width: 24,
    height: 28,
  })
  expect(
    circuit.db.pcb_panelization_placement_error
      .list()
      .map((error) => error.message),
  ).toMatchInlineSnapshot(`[]`)
})
