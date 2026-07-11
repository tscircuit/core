import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { normalizeSchematicSymbolCircuitJson } from "lib/utils/schematic/normalizeSchematicSymbolCircuitJson"

test("normalizeSchematicSymbolCircuitJson recenters imported symbol primitives and preserves the input", () => {
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
      center: { x: 25, y: -10 },
      size: { width: 0, height: 0 },
      is_box_with_pins: true,
    },
    {
      type: "source_port",
      source_port_id: "source_port_imported_1",
      source_component_id: "source_component_imported",
      pin_number: 1,
      name: "VIN",
      port_hints: ["pin1"],
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_imported_1",
      schematic_component_id: "schematic_component_imported",
      source_port_id: "source_port_imported_1",
      center: { x: 24, y: -10.5 },
      facing_direction: "left",
      side_of_component: "left",
      distance_from_component_edge: 0.4,
      pin_number: 1,
      is_connected: false,
    },
    {
      type: "schematic_rect",
      schematic_rect_id: "schematic_rect_imported",
      schematic_component_id: "schematic_component_imported",
      center: { x: 25, y: -10 },
      width: 2,
      height: 1.6,
      rotation: 0,
      stroke_width: 0.05,
      color: "rgba(132, 0, 0)",
      is_filled: false,
      is_dashed: false,
    },
  ] as AnyCircuitElement[]
  const originalSymbolCircuitJson = structuredClone(symbolCircuitJson)

  const normalizedSymbolCircuitJson =
    normalizeSchematicSymbolCircuitJson(symbolCircuitJson)
  const normalizedSchematicComponent = normalizedSymbolCircuitJson.find(
    (
      element,
    ): element is Extract<AnyCircuitElement, { type: "schematic_component" }> =>
      element.type === "schematic_component",
  )
  const normalizedSchematicPort = normalizedSymbolCircuitJson.find(
    (
      element,
    ): element is Extract<AnyCircuitElement, { type: "schematic_port" }> =>
      element.type === "schematic_port",
  )
  const normalizedSchematicRect = normalizedSymbolCircuitJson.find(
    (
      element,
    ): element is Extract<AnyCircuitElement, { type: "schematic_rect" }> =>
      element.type === "schematic_rect",
  )

  expect(symbolCircuitJson).toEqual(originalSymbolCircuitJson)
  expect(normalizedSchematicComponent?.center).toEqual({ x: 0, y: 0 })
  expect(normalizedSchematicPort?.center).toEqual({ x: -1, y: -0.5 })
  expect(normalizedSchematicRect?.center).toEqual({ x: 0, y: 0 })
})
