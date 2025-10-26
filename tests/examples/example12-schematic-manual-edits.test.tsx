import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example12-schematic-manual-edits", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="12mm"
      height="10mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "U1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <chip name="U1" footprint="soic8" />
      <trace from=".U1 > .pin1" to="net.GND" />
    </board>,
  )

  circuit.render()

  expect({
    component_center: circuit.db.schematic_component
      .list()
      .map((c) => c.center)?.[0],
    text_centers: circuit.db.schematic_text.list().map((t) => t.position),
  }).toMatchInlineSnapshot(`
{
  "component_center": {
    "x": 5,
    "y": 5,
  },
  "text_centers": [
    {
      "x": 4.6,
      "y": 4.37,
    },
    {
      "x": 4.6,
      "y": 5.63,
    },
  ],
}
`)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
