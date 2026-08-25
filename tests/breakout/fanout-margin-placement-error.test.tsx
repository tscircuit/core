import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout boundaries must maintain fanoutMargin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="14mm" height="8mm" routingDisabled>
      <fanout name="LEFT" pcbX={-1.5} fanoutMargin="2.1mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </fanout>
      <fanout name="RIGHT" pcbX={1.5}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </fanout>
      <pcbnotetext
        text="TEST: fanoutMargin is clearance outside fanout boundaries"
        pcbY={3}
        fontSize="0.3mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_placement_error
      .list()
      .map((error) => error.message)
      .filter((message) => message.includes("fanoutMargin")),
  ).toEqual([
    'Fanout boundaries "LEFT" and "RIGHT" do not maintain the required 2.1mm fanoutMargin.',
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
