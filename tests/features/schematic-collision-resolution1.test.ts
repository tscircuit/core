import { test, expect } from "bun:test"
import { detectSchematicCollisions } from "lib/utils/schematic/detectSchematicCollisions"
import { resolveSchematicCollisions } from "lib/utils/schematic/resolveSchematicCollisions"
import type { AnyCircuitElement } from "circuit-json"

test("detectSchematicCollisions detects overlapping components and resolveSchematicCollisions fixes them", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "schematic_component",
      schematic_component_id: "sc1",
      source_component_id: "src1",
      center: { x: 0, y: 0 },
      size: { width: 1, height: 0.5 },
      rotation: 0,
      symbol_display_value: "",
      port_labels: {},
    } as any,
    {
      type: "schematic_component",
      schematic_component_id: "sc2",
      source_component_id: "src2",
      // overlaps sc1: same center, same size
      center: { x: 0.2, y: 0 },
      size: { width: 1, height: 0.5 },
      rotation: 0,
      symbol_display_value: "",
      port_labels: {},
    } as any,
  ]

  const beforeCollisions = detectSchematicCollisions(circuitJson)
  expect(beforeCollisions.length).toBeGreaterThan(0)

  resolveSchematicCollisions(circuitJson)

  const afterCollisions = detectSchematicCollisions(circuitJson)
  expect(afterCollisions.length).toBe(0)
})
