import { expect, test } from "bun:test"
import type { SymbolProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a rotated custom symbol with an off-center viewbox routes from its resized terminal", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const symbolProps: SymbolProps = {
    width: 4,
    viewbox: { minX: 0, maxX: 2, minY: 0, maxY: 1 },
  }
  circuit.add(
    <board>
      <resistor name="R1" resistance="1k" schX={-1} schY={2} />
      <chip
        name="S1"
        schX={4}
        schY={2}
        schRotation={180}
        connections={{ pin1: ".R1 > .pin2" }}
      >
        <symbol {...symbolProps}>
          <schematicrect
            schX={1}
            schY={0.5}
            width={2}
            height={1}
            strokeWidth={0.05}
          />
          <port
            name="pin1"
            pinNumber={1}
            direction="right"
            schX={2.5}
            schY={0.5}
            schStemLength={0.5}
          />
        </symbol>
      </chip>
      <schematictext
        schX={4}
        schY={0.8}
        text="Width-only resize, off-center viewbox, 180 deg"
        fontSize={0.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const source = circuit.db.source_component.getWhere({ name: "S1" })!
  const component = circuit.db.schematic_component.getWhere({
    source_component_id: source.source_component_id,
  })!
  const port = circuit.db.schematic_port.getWhere({
    schematic_component_id: component.schematic_component_id,
  })!
  const stem = circuit.db.schematic_line.getWhere({
    schematic_component_id: component.schematic_component_id,
  })!
  expect(component.center.x).toBeCloseTo(4)
  expect(component.center.y).toBeCloseTo(2)
  expect(component.size.width).toBeCloseTo(4)
  expect(component.size.height).toBeCloseTo(1)
  expect(port.center.x).toBeCloseTo(1)
  expect(port.center.y).toBeCloseTo(2)
  expect(port.facing_direction).toBe("left")
  expect(port.side_of_component).toBe("left")
  expect(stem.x1).toBeCloseTo(1)
  expect(stem.x2).toBeCloseTo(2)
  expect(stem.y1).toBeCloseTo(2)
  expect(stem.y2).toBeCloseTo(2)
  expect(port.distance_from_component_edge).toBeCloseTo(1)
  expect(circuit.db.schematic_net_label.list()).toHaveLength(0)
  const traces = circuit.db.schematic_trace.list()
  expect(traces.length).toBeGreaterThan(0)
  for (const trace of traces) {
    for (const edge of trace.edges) {
      expect(edge.from.y).toBeCloseTo(2)
      expect(edge.to.y).toBeCloseTo(2)
    }
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
