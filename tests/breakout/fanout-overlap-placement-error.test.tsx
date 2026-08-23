import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("overlapping fanout boundaries produce a placement error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <fanout name="LEFT" pcbX={-1} padding="1mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </fanout>
      <fanout name="RIGHT" pcbX={1} padding="1mm">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </fanout>
      <pcbnotetext
        text="TEST: overlapping fanout boundaries are placement errors"
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
      .filter((message) => message.includes("Fanout boundaries")),
  ).toEqual([
    'Fanout boundaries "LEFT" and "RIGHT" overlap. Fanout boundaries may not overlap.',
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
