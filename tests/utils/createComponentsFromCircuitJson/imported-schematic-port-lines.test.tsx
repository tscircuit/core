import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { SchematicLine } from "lib/components/primitive-components/SchematicLine"
import { SymbolComponent } from "lib/components/primitive-components/Symbol"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

test("createComponentsFromCircuitJson draws imported schematic port stems toward the symbol body", () => {
  const portX = -25
  const bodyEdgeX = -23.49626090569173
  const distanceFromComponentEdge = bodyEdgeX - portX

  const components = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "schematic_symbol",
        schematic_symbol_id: "schematic_symbol_0",
        name: "LM358",
      },
      {
        type: "schematic_component",
        schematic_component_id: "schematic_component_0",
        source_component_id: "source_component_0",
        schematic_symbol_id: "schematic_symbol_0",
        center: { x: -25, y: 0 },
        size: { width: 0, height: 0 },
        is_box_with_pins: true,
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_0",
        schematic_component_id: "schematic_component_0",
        source_port_id: "source_port_0",
        center: { x: portX, y: 0 },
        facing_direction: "up",
        side_of_component: "left",
        distance_from_component_edge: distanceFromComponentEdge,
      },
    ] as AnyCircuitElement[],
  )

  const symbol = components.find(
    (component) => component instanceof SymbolComponent,
  ) as SymbolComponent | undefined
  const portStem = symbol?.children.find(
    (component) => component instanceof SchematicLine,
  ) as SchematicLine | undefined

  expect(portStem).toBeDefined()
  expect(portStem!._parsedProps.x1).toBe(portX)
  expect(portStem!._parsedProps.x2).toBe(bodyEdgeX)
})

test("createComponentsFromCircuitJson preserves body-edge-centered imported schematic port stems", () => {
  const bodyEdgeX = -1
  const externalPortX = -1.4

  const components = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "schematic_symbol",
        schematic_symbol_id: "schematic_symbol_0",
        name: "imported_test_symbol",
      },
      {
        type: "schematic_component",
        schematic_component_id: "schematic_component_0",
        source_component_id: "source_component_0",
        schematic_symbol_id: "schematic_symbol_0",
        center: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        is_box_with_pins: true,
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_0",
        schematic_component_id: "schematic_component_0",
        source_port_id: "source_port_0",
        center: { x: bodyEdgeX, y: 0 },
        facing_direction: "left",
        side_of_component: "left",
        distance_from_component_edge: 0.4,
      },
    ] as AnyCircuitElement[],
  )

  const symbol = components.find(
    (component) => component instanceof SymbolComponent,
  ) as SymbolComponent | undefined
  const portStem = symbol?.children.find(
    (component) => component instanceof SchematicLine,
  ) as SchematicLine | undefined

  expect(portStem).toBeDefined()
  expect(portStem!._parsedProps.x1).toBe(bodyEdgeX)
  expect(portStem!._parsedProps.x2).toBe(externalPortX)
})

test("createComponentsFromCircuitJson uses imported symbol stroke width for schematic port stems", () => {
  const importedStrokeWidth = 0.02

  const components = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "schematic_symbol",
        schematic_symbol_id: "schematic_symbol_0",
        name: "LM358",
      },
      {
        type: "schematic_component",
        schematic_component_id: "schematic_component_0",
        source_component_id: "source_component_0",
        schematic_symbol_id: "schematic_symbol_0",
        center: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        is_box_with_pins: true,
      },
      {
        type: "schematic_rect",
        schematic_component_id: "schematic_component_0",
        schematic_symbol_id: "schematic_symbol_0",
        schematic_rect_id: "schematic_rect_0",
        center: { x: 0, y: 0 },
        width: 1,
        height: 1,
        stroke_width: importedStrokeWidth,
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_0",
        schematic_component_id: "schematic_component_0",
        source_port_id: "source_port_0",
        center: { x: -1, y: 0 },
        facing_direction: "left",
        side_of_component: "left",
        distance_from_component_edge: 0.4,
      },
    ] as AnyCircuitElement[],
  )

  const symbol = components.find(
    (component) => component instanceof SymbolComponent,
  ) as SymbolComponent | undefined
  const portStem = symbol?.children.find(
    (component) => component instanceof SchematicLine,
  ) as SchematicLine | undefined

  expect(portStem).toBeDefined()
  expect(portStem!._parsedProps.strokeWidth).toBe(importedStrokeWidth)
})
