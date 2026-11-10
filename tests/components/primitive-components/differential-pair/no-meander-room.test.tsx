import { NoMeanderDifferentialPairBoard } from "tests/fixtures/no-meander-differential-pair-board"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("no meander room produces one measured autorouting error and no accepted copper", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<NoMeanderDifferentialPairBoard />)

  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_autorouting_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]!.message).toBe(
    'Differential pair "USB": positive lane is 1.200mm longer (positive 21.200mm, negative 20.000mm); maximum allowed skew is 0.1mm',
  )
  expect(errors[0]!.differential_pair_length_skew).toMatchObject({
    source_bus_id: circuit.db.source_bus.getWhere({ name: "USB" })!
      .source_bus_id,
    positive_length: 21.2,
    negative_length: 20,
  })
  expect(circuit.db.pcb_trace.list()).toEqual([])
  expect(circuit.db.pcb_bus_length_skew_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
