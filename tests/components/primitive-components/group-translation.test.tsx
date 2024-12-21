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

test("Non-subcircuit group offset schematic with resistor and capacitor connected by trace", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <group name="group1" schX={3} schY={3}>
      <resistor name="R1" footprint="0402" resistance={1000} />
      <capacitor name="C1" footprint="0402" capacitance={1000} schX={3} />
      <trace from=".R1 > .2" to=".C1 > .1" />
    </group>,
  )

  circuit.render()

  const resistor = circuit.selectOne("resistor")!
  const capacitor = circuit.selectOne("capacitor")!

  expect(
    resistor._getGlobalSchematicPositionBeforeLayout(),
  ).toMatchInlineSnapshot(`
{
  "x": 3,
  "y": 3,
}
`)

  expect(
    capacitor._getGlobalSchematicPositionBeforeLayout(),
  ).toMatchInlineSnapshot(`
{
  "x": 6,
  "y": 3,
}
`)

  // schematic_trace generated after the layout
  const schematic_trace = su(circuit.getCircuitJson()).schematic_trace.list()

  expect(schematic_trace).toMatchInlineSnapshot(`
[
  {
    "edges": [
      {
        "from": {
          "layer": "top",
          "route_type": "wire",
          "width": 0.1,
          "x": 3.5337907000000004,
          "y": 3.004741299999999,
        },
        "to": {
          "layer": "top",
          "route_type": "wire",
          "width": 0.1,
          "x": 5.2987907,
          "y": 3.004741299999999,
        },
      },
      {
        "from": {
          "layer": "top",
          "route_type": "wire",
          "width": 0.1,
          "x": 5.2987907,
          "y": 3.004741299999999,
        },
        "to": {
          "x": 5.4487907,
          "y": 3.004741299999999,
        },
      },
      {
        "from": {
          "x": 5.4487907,
          "y": 3.004741299999999,
        },
        "to": {
          "x": 5.4487907,
          "y": 3.0336195999999997,
        },
      },
    ],
    "junctions": [],
    "schematic_trace_id": "schematic_trace_0",
    "source_trace_id": "source_trace_0",
    "type": "schematic_trace",
  },
]
`)
})
