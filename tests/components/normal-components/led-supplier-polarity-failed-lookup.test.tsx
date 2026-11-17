import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("failed early supplier lookup emits one warning without retrying in PartsEngineRender", async () => {
  let calls = 0
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: () => {
          calls++
          throw new Error("supplier unavailable")
        },
        fetchPartCircuitJson: () => {
          throw new Error("must not fetch without a candidate")
        },
      },
    },
  })
  circuit.add(
    <board width={12} height={8}>
      <led name="D1" footprint="0603" color="red" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(calls).toBe(1)
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(1)
  expect(circuit.db.source_component.list()[0]!.supplier_part_numbers).toEqual(
    {},
  )
})
