import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Non-subcircuit group offset schematic with resistor", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <group name="group1" schX={1}>
      <resistor name="R1" footprint="0402" resistance={1000} />
    </group>,
  )

  circuit.render()

  const resistor = circuit.selectOne("resistor")!

  const pos = resistor._getGlobalSchematicPositionBeforeLayout()

  expect(pos).toMatchInlineSnapshot(`
{
  "x": 1,
  "y": 0,
}
`)

  expect(circuit.db.schematic_component.list()).toMatchInlineSnapshot(`
[
  {
    "center": {
      "x": 1,
      "y": 0,
    },
    "rotation": 0,
    "schematic_component_id": "schematic_component_0",
    "size": {
      "height": 0.24999600000000122,
      "width": 1.1238982820000005,
    },
    "source_component_id": "source_component_0",
    "symbol_display_value": "1kΩ",
    "symbol_name": "boxresistor_horz",
    "type": "schematic_component",
  },
]
`)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
