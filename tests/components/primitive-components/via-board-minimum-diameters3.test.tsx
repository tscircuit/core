import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boards without via minimums keep the default 0.2/0.3mm via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <via pcbX={0} pcbY={0} fromLayer="top" toLayer="bottom" />
      <pcbnotetext
        pcbX={0}
        pcbY={2.5}
        fontSize={0.45}
        text="no board via minimums: default 0.2mm drill / 0.3mm pad"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const [via] = circuit.db.pcb_via.list()
  expect([via.hole_diameter, via.outer_diameter]).toEqual([0.2, 0.3])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
