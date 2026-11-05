import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
const symbol = [
  { type: "schematic_symbol", schematic_symbol_id: "ss", name: "custom" },
  {
    type: "schematic_component",
    schematic_component_id: "sc",
    source_component_id: "src",
    schematic_symbol_id: "ss",
    center: { x: 0, y: 0 },
    size: { width: 2, height: 2 },
    is_box_with_pins: true,
  },
  {
    type: "source_port",
    source_port_id: "s1",
    source_component_id: "src",
    pin_number: 1,
    name: "GND",
    port_hints: ["pin1", "GND"],
  },
  {
    type: "source_port",
    source_port_id: "s2",
    source_component_id: "src",
    pin_number: 2,
    name: "SIG",
    port_hints: ["pin2", "SIG"],
  },
  {
    type: "schematic_port",
    schematic_port_id: "p1",
    schematic_component_id: "sc",
    source_port_id: "s1",
    center: { x: -1, y: 0 },
    facing_direction: "left",
    side_of_component: "left",
    distance_from_component_edge: 0.4,
    pin_number: 1,
    is_connected: false,
  },
  {
    type: "schematic_port",
    schematic_port_id: "p2",
    schematic_component_id: "sc",
    source_port_id: "s2",
    center: { x: 1, y: 0 },
    facing_direction: "right",
    side_of_component: "right",
    distance_from_component_edge: 0.4,
    pin_number: 2,
    is_connected: false,
  },
] as AnyCircuitElement[]
test("JSON symbol preserves separate PCB ports for a split physical pin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} routingDisabled>
      <chip
        name="U1"
        symbol={symbol}
        pinLabels={{ pin1: "GND", pin2: "SIG" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={-3}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={0}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={3}
              portHints={["pin2"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const db = circuit.db
  const pads = db.pcb_smtpad.list()
  const ports = db.pcb_port.list()
  const split = pads
    .filter((x) => x.port_hints?.includes("pin1"))
    .map(
      (x) => ports.find((p) => p.pcb_port_id === x.pcb_port_id)?.source_port_id,
    )

  expect(ports).toHaveLength(3)
  expect(new Set(split).size).toBe(2)
  expect(split.every(Boolean)).toBe(true)
  const groups = db.source_component_internal_connection.list()
  expect(groups).toHaveLength(1)
  expect(new Set(groups[0].source_port_ids)).toEqual(new Set(split))
  const signalPad = pads.find((p) => p.port_hints?.includes("pin2"))!
  const signalPort = ports.find((p) => p.pcb_port_id === signalPad.pcb_port_id)!
  const signalSource = db.source_port
    .list()
    .find((p) => p.source_port_id === signalPort.source_port_id)!
  expect(signalSource.pin_number).toBe(2)
  expect(groups[0].source_port_ids).not.toContain(signalSource.source_port_id)
  expect(db.source_ambiguous_port_reference.list()).toEqual([])
})
