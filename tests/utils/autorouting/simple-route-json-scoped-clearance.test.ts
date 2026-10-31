import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbClearanceRule } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("SRJ retains independent scoped rules and original net identities", () => {
  const rules: PcbClearanceRule[] = [
    {
      name: "EARTH outer",
      priority: 1,
      enabled: true,
      clearance: 4.14,
      scope1: {
        type: "and",
        scopes: [
          { type: "net", net_ids: ["source_net_earth"] },
          { type: "layer", layers: ["top", "bottom"] },
        ],
      },
      scope2: { type: "all" },
    },
  ]
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_1",
      center: { x: 0, y: 0 },
      width: 40,
      height: 30,
      num_layers: 4,
      material: "fr4",
      thickness: 1.6,
      clearance_rules: rules,
    },
    {
      type: "source_net",
      source_net_id: "source_net_earth",
      name: "EARTH",
      member_source_group_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_link",
      connected_source_net_ids: ["source_net_earth"],
      connected_source_port_ids: ["source_port_a", "source_port_b"],
    },
    ...["a", "b"].flatMap((name, index): AnyCircuitElement[] => [
      { type: "source_port", source_port_id: `source_port_${name}`, name },
      {
        type: "pcb_port",
        pcb_port_id: `pcb_port_${name}`,
        source_port_id: `source_port_${name}`,
        x: index * 10,
        y: 0,
        layers: ["top"],
      },
      {
        type: "pcb_smtpad",
        pcb_smtpad_id: `pcb_smtpad_${name}`,
        pcb_port_id: `pcb_port_${name}`,
        pcb_component_id: "pcb_component_1",
        shape: "rect",
        x: index * 10,
        y: 0,
        width: 1,
        height: 1,
        layer: "top",
      },
    ]),
  ]
  const original = structuredClone(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  expect(simpleRouteJson.clearanceRules).toEqual(rules)
  expect(simpleRouteJson.connections).toHaveLength(1)
  expect(simpleRouteJson.connections[0]!.sourceNetIds).toEqual([
    "source_net_earth",
  ])
  expect(circuitJson).toEqual(original)
  simpleRouteJson.clearanceRules![0]!.clearance = 25.4
  expect(rules[0]!.clearance).toBe(4.14)
  const board = circuitJson.find((element) => element.type === "pcb_board")!
  delete board.clearance_rules
  const legacy = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  }).simpleRouteJson
  expect(legacy.clearanceRules).toBeUndefined()
  expect(legacy.connections[0]!.sourceNetIds).toBeUndefined()
})
