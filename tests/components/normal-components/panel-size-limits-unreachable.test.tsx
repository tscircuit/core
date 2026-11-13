import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("size limits that no grid layout can meet are reported", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" maxWidth="20mm">
      <board width="30mm" height="18mm" routingDisabled />
    </panel>,
  )
  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_panelization_placement_error
      .list()
      .map((error) => error.message),
  ).toMatchInlineSnapshot(`
    [
      "Panel width 40 mm exceeds the maximum width 20 mm",
    ]
  `)
})
