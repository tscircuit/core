import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("root subcircuit places its public ports on all four boundary sides", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <subcircuit name="INTERFACE" schX={8} schY={-3} schMaxTraceDistance={100}>
      <chip
        name="U1"
        schWidth={2}
        schHeight={2}
        schX={0}
        schY={0}
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "VCC", pin4: "GND" }}
        schPinArrangement={{
          leftSide: { pins: [1], direction: "top-to-bottom" },
          rightSide: { pins: [2], direction: "top-to-bottom" },
          topSide: { pins: [3], direction: "left-to-right" },
          bottomSide: { pins: [4], direction: "left-to-right" },
        }}
      />
      <port name="INPUT" direction="left" connectsTo="U1.IN" />
      <port name="OUTPUT" direction="right" connectsTo="U1.OUT" />
      <port name="POWER" direction="up" connectsTo="U1.VCC" />
      <port name="GROUND" direction="down" connectsTo="U1.GND" />
      <port name="UNCONNECTED" direction="left" />
    </subcircuit>,
  )
  await circuit.renderUntilSettled()
  const group = circuit.db.schematic_group
    .list()
    .find((group) => group.show_boundary)!
  const ports = circuit.db.schematic_port
    .list()
    .filter((port) => port.schematic_group_id === group.schematic_group_id)
  expect(ports).toHaveLength(5)
  expect(ports.map((port) => port.facing_direction)).toEqual([
    "left",
    "left",
    "right",
    "up",
    "down",
  ])
  for (const port of ports) {
    const boundary = port.boundary_position!
    const xOnEdge =
      Math.abs(Math.abs(boundary.x - group.center.x) - group.width / 2) < 1e-6
    const yOnEdge =
      Math.abs(Math.abs(boundary.y - group.center.y) - group.height / 2) < 1e-6
    expect(xOnEdge || yOnEdge).toBe(true)
    expect(
      Math.hypot(port.center.x - boundary.x, port.center.y - boundary.y),
    ).toBeCloseTo(0.4)
    expect(
      circuit.db.source_port.get(port.source_port_id)?.source_group_id,
    ).toBe(group.source_group_id)
  }
  expect(group.center.x).toBeGreaterThan(5)
  expect(group.center.y).toBeLessThan(0)
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
