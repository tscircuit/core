import { test, expect } from "bun:test"
import { sel } from "lib/sel"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sel supports MOSFET pin names (gate, source, drain)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <mosfet
        name="Q1"
        footprint="sot23"
        channelType="n"
        mosfetMode="enhancement"
      />
      <trace from={sel.Q1.gate} to={sel.net.GND} />
      <trace from={sel.Q1.source} to={sel.net.V3_3} />
      <trace from={sel.Q1.drain} to={sel.net.V3_3} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_net_label.list()).toMatchInlineSnapshot(`
    [
      {
        "anchor_position": {
          "x": 0.30397715550000004,
          "y": 0.5800832909999993,
        },
        "anchor_side": "bottom",
        "center": {
          "x": 0.30397715550000004,
          "y": 0.7810832909999993,
        },
        "schematic_net_label_id": "schematic_net_label_0",
        "source_net_id": "source_net_0",
        "text": "GND",
        "type": "schematic_net_label",
      },
      {
        "anchor_position": {
          "x": 0.31067575550000137,
          "y": -0.5800832909999993,
        },
        "anchor_side": "top",
        "center": {
          "x": 0.31067575550000137,
          "y": -0.7810832909999993,
        },
        "schematic_net_label_id": "schematic_net_label_1",
        "source_net_id": "source_net_0",
        "symbol_name": "ground_down",
        "text": "GND",
        "type": "schematic_net_label",
      },
      {
        "anchor_position": {
          "x": 0.30397715550000004,
          "y": 0.5519248499999994,
        },
        "anchor_side": "bottom",
        "center": {
          "x": 0.30397715550000004,
          "y": 0.6419248499999993,
        },
        "schematic_net_label_id": "schematic_net_label_2",
        "source_net_id": "source_net_1",
        "symbol_name": "vcc_up",
        "text": "V3_3",
        "type": "schematic_net_label",
      },
      {
        "anchor_position": {
          "x": 0.31067575550000137,
          "y": -0.5519248499999994,
        },
        "anchor_side": "top",
        "center": {
          "x": 0.31067575550000137,
          "y": -0.6419248499999993,
        },
        "schematic_net_label_id": "schematic_net_label_3",
        "source_net_id": "source_net_1",
        "text": "V3_3",
        "type": "schematic_net_label",
      },
      {
        "anchor_position": {
          "x": -0.41859744450000014,
          "y": -0.10250625000000019,
        },
        "anchor_side": "right",
        "center": {
          "x": -0.5685974445000002,
          "y": -0.10250625000000019,
        },
        "schematic_net_label_id": "schematic_net_label_4",
        "source_net_id": "source_net_0",
        "text": "GND",
        "type": "schematic_net_label",
      },
    ]
  `)

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
