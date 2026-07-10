import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Port } from "lib/components/primitive-components/Port/Port"
import { SchematicRect } from "lib/components/primitive-components/SchematicRect"
import { SymbolComponent } from "lib/components/primitive-components/Symbol"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const symbolCircuitJson = [
  {
    type: "schematic_symbol",
    schematic_symbol_id: "schematic_symbol_imported",
    name: "custom_chip_symbol",
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_component_imported",
    source_component_id: "source_component_imported",
    schematic_symbol_id: "schematic_symbol_imported",
    center: { x: 40, y: 12.5 },
    size: { width: 0, height: 0 },
    is_box_with_pins: true,
  },
  {
    type: "source_port",
    source_port_id: "source_port_imported_1",
    source_component_id: "source_component_imported",
    pin_number: 1,
    name: "VIN",
    port_hints: ["pin1", "vin"],
  },
  {
    type: "source_port",
    source_port_id: "source_port_imported_2",
    source_component_id: "source_component_imported",
    pin_number: 2,
    name: "GND",
    port_hints: ["pin2", "gnd"],
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_imported_1",
    schematic_component_id: "schematic_component_imported",
    source_port_id: "source_port_imported_1",
    center: { x: 38.98, y: 12.1 },
    facing_direction: "left",
    side_of_component: "left",
    distance_from_component_edge: 0.4,
    pin_number: 1,
    is_connected: false,
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_imported_2",
    schematic_component_id: "schematic_component_imported",
    source_port_id: "source_port_imported_2",
    center: { x: 41.02, y: 12.9 },
    facing_direction: "right",
    side_of_component: "right",
    distance_from_component_edge: 0.4,
    pin_number: 2,
    is_connected: false,
  },
  {
    type: "schematic_rect",
    schematic_rect_id: "schematic_rect_imported",
    schematic_component_id: "schematic_component_imported",
    center: { x: 40, y: 12.5 },
    width: 2,
    height: 1.6,
    rotation: 0,
    stroke_width: 0.05,
    color: "rgba(132, 0, 0)",
    is_filled: false,
    is_dashed: false,
  },
] as AnyCircuitElement[]

test("chip symbol accepts imported circuit json without mutating the input", async () => {
  const originalSymbolCircuitJson = structuredClone(symbolCircuitJson)
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <chip
        name="U1"
        footprint="pinrow2"
        symbol={symbolCircuitJson}
        connections={{
          pin1: "net.VIN",
          pin2: "net.GND",
        }}
      />
    </board>,
  )

  const chip = circuit.selectOne("chip") as any
  chip._addChildrenFromCircuitJsonSymbol()
  chip._addChildrenFromCircuitJsonSymbol()

  await circuit.renderUntilSettled()

  const symbolComponents = circuit.selectAll("symbol") as SymbolComponent[]

  expect(symbolCircuitJson).toEqual(originalSymbolCircuitJson)
  expect(circuit.selectAll("port")).toHaveLength(2)
  expect(symbolComponents).toHaveLength(1)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    grid: { cellSize: 0.5, labelCells: true },
  })
})
