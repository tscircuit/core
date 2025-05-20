import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic-net-label", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="soic4"
        connections={{
          pin1: "net.GND",
        }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_trace.list()).toMatchInlineSnapshot(`[]`)

  expect(circuit.db.schematic_net_label.list()).toMatchInlineSnapshot(`
    [
      {
        "anchor_position": {
          "x": -0.6000000000000001,
          "y": 0.1,
        },
        "anchor_side": "right",
        "center": {
          "x": -0.6000000000000001,
          "y": 0.1,
        },
        "schematic_net_label_id": "schematic_net_label_0",
        "schematic_trace_id": null,
        "source_net_id": "source_net_0",
        "source_trace_id": "source_trace_0",
        "text": "GND",
        "type": "schematic_net_label",
      },
    ]
  `)
})
