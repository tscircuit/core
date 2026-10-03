import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("doNotPlace suppresses missing-MPN warnings across non-passive part types", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic8" doNotPlace />
      <diode name="D1" footprint="sod123" doNotPlace />
      <connector
        name="J1"
        footprint="pinrow2"
        pinLabels={{ pin1: "A", pin2: "B" }}
        doNotPlace
      />
      <chip name="U2" footprint="soic8" doNotPlace={false} />
      <chip name="U3" footprint="soic8" />
    </board>,
  )
  circuit.render()

  const warnedNames = circuit.db.source_missing_manufacturer_part_number_warning
    .list()
    .map(
      (warning) =>
        circuit.db.source_component.get(warning.source_component_id)?.name,
    )
  expect(warnedNames.sort()).toEqual(["U2", "U3"])
})
