import { expect, test } from "bun:test"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a fixed member outside explicit target bounds is rejected", async () => {
  const { circuit } = getTestFixture()
  let phaseStarts = 0
  circuit.on("autorouting:start", () => phaseStarts++)
  addFixedMatchedBus(circuit, {
    matched: false,
    targetLength: 22,
    lengthTolerance: 0.1,
    explanation:
      "Fixed DATA0 = 28 mm cannot fit a 22 ± 0.1 mm target; DATA1 stays pending",
  })
  await circuit.renderUntilSettled()
  expect(phaseStarts).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    {
      message: expect.stringContaining(
        '"DATA0" at 28.000 mm, outside its target range 21.900–22.100 mm',
      ),
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
