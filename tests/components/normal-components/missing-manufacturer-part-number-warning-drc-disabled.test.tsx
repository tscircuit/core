import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("missing-MPN warnings honor platform DRC disable settings", () => {
  for (const platformDisabled of [undefined, true, false]) {
    const { circuit } = getTestFixture({
      platform: { drcChecksDisabled: platformDisabled },
    })
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic8" />
      </board>,
    )
    circuit.render()
    expect(
      circuit.db.source_missing_manufacturer_part_number_warning.list(),
    ).toHaveLength(platformDisabled === true ? 0 : 1)
  }
})
