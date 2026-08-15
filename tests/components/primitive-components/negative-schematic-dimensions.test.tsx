import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("negative schematic dimensions emit source_invalid_component_property_error (#2861)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        schWidth={-4}
        schHeight={3}
        symbol={
          <symbol>
            <schematicrect width={-3} height={1} schX={0} schY={0} />
            <schematiccircle center={{ x: 0, y: 0 }} radius={-1} />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors.length).toBeGreaterThanOrEqual(3)

  const propertyNames = errors.map((e) => e.property_name)
  expect(propertyNames).toContain("schWidth")
  expect(propertyNames).toContain("width")
  expect(propertyNames).toContain("radius")
})
