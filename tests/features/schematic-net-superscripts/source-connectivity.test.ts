import type { AnyCircuitElement } from "circuit-json"
import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { assignSchematicNetLabelSuperscripts } from "lib/utils/schematic/assign-schematic-net-label-superscripts"

test("internal connections, mixed label kinds, and reordered source JSON use the same network numbering", () => {
  const circuitJson: AnyCircuitElement[] = []
  for (const [index, id] of ["a", "b", "c"].entries()) {
    circuitJson.push({
      type: "source_net",
      source_net_id: `net_${id}`,
      name: "GND",
      member_source_group_ids: [],
      subcircuit_id: id,
      subcircuit_connectivity_map_key: "same_scoped_key",
    })
    circuitJson.push({
      type: "source_trace",
      source_trace_id: `trace_${id}`,
      connected_source_net_ids: [`net_${id}`],
      connected_source_port_ids: [`port_${id}`],
    })
    circuitJson.push({
      type: "schematic_net_label",
      schematic_net_label_id: `label_${id}`,
      source_net_id: `net_${id}`,
      text: "GND",
      center: { x: index * 2, y: 0 },
      anchor_position: { x: index * 2, y: 0 },
      anchor_side: "left",
    })
    circuitJson.push({
      type: "schematic_text",
      schematic_text_id: `inline_${id}`,
      font_size: 0.18,
      rotation: 0,
      color: "black",
      source_trace_id: `trace_${id}`,
      text: "GND",
      position: { x: index * 2, y: -1 },
      anchor: "left",
    })
  }
  circuitJson.push({
    type: "source_component_internal_connection",
    source_component_internal_connection_id: "internal_connection",
    source_component_id: "chip",
    source_port_ids: ["port_a", "port_bridge"],
  })
  circuitJson.push({
    type: "source_component",
    source_component_id: "chip",
    name: "U1",
    ftype: "simple_chip",
    internally_connected_source_port_ids: [["port_bridge", "port_b"]],
  })
  circuitJson.push({
    type: "schematic_text",
    schematic_text_id: "ordinary_text",
    font_size: 0.18,
    rotation: 0,
    color: "black",
    anchor: "left",
    text: "GND",
    display_superscript: "note",
    position: { x: 0, y: -2 },
  })
  const db = cju(circuitJson)
  assignSchematicNetLabelSuperscripts(db)
  expect(
    db.schematic_net_label.list().map((label) => label.display_superscript),
  ).toEqual(["1", "1", "2"])
  expect(
    db.schematic_text.list().map((label) => label.display_superscript),
  ).toEqual(["1", "1", "2", "note"])
  const reversed = cju(db.toArray().toReversed())
  assignSchematicNetLabelSuperscripts(reversed)
  expect(
    reversed.schematic_net_label
      .list()
      .map((label) => label.display_superscript),
  ).toEqual(["2", "1", "1"])
  expect(
    reversed.schematic_text.get("ordinary_text")!.display_superscript,
  ).toBe("note")
  expect(convertCircuitJsonToSchematicSvg(db.toArray())).toMatchSvgSnapshot(
    import.meta.path,
  )
  db.source_trace.insert({
    connected_source_net_ids: ["net_b", "net_c"],
    connected_source_port_ids: [],
  })
  assignSchematicNetLabelSuperscripts(db)
  expect(
    db.schematic_net_label
      .list()
      .every((label) => label.display_superscript === undefined),
  ).toBe(true)
  expect(
    db.schematic_text
      .list()
      .filter((label) => label.source_trace_id)
      .every((label) => label.display_superscript === undefined),
  ).toBe(true)
  expect(db.schematic_text.get("ordinary_text")!.display_superscript).toBe(
    "note",
  )
})
