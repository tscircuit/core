import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a <toolingrail> uses the explicit size of a non-grid panel", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="none" width="60mm" height="40mm" edgePadding="6mm">
      <board name="B1" width="14mm" height="18mm" routingDisabled />
      <toolingrail name="RAIL" panelSide="right" width="4mm" />
    </panel>,
  )
  await circuit.renderUntilSettled()

  // A 4 mm rail along the right edge of the 60 x 40 mm panel.
  expect(
    circuit.db.pcb_group.list().find((group) => group.name === "RAIL"),
  ).toMatchObject({
    center: { x: 28, y: 0 },
    width: 4,
    height: 40,
  })
})
