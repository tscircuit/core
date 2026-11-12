import { expectWiredInterface } from "tests/fixtures/cc2340r5-reference/expect-wired-interface"
import { expect, test } from "bun:test"
import Cc2340Reference, {
  exportedNets,
} from "tests/fixtures/cc2340r5-reference"
import { getElectricalSignature } from "tests/fixtures/cc2340r5-reference/electrical-signature"
import moduleSignature from "tests/fixtures/cc2340r5-reference/module-electrical-signature"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone CC2340R5 reference exports its real GPIO, supply and SWD interface", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(<Cc2340Reference />)
  await circuit.renderUntilSettled()
  const group = circuit.db.schematic_group
    .list()
    .find((group) => group.show_boundary)!
  const ports = circuit.db.schematic_port
    .list()
    .filter((port) => port.schematic_group_id === group.schematic_group_id)
  expect(ports.map((port) => port.display_pin_label).sort()).toEqual(
    [...exportedNets].sort(),
  )
  expect(circuit.db.schematic_component.list()).toHaveLength(27)
  expect(
    circuit.db.source_component
      .list()
      .find((component) => component.name === "U1")?.manufacturer_part_number,
  ).toBe("CC2340R52E0RGER")
  expect(getElectricalSignature(circuit.getCircuitJson())).toEqual(
    moduleSignature,
  )
  expect(ports.every((port) => port.facing_direction === "left")).toBe(true)
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
  }
  // Cross-section connections remain label-connected, as in the published design.
  const u1 = circuit.db.source_component
    .list()
    .find((component) => component.name === "U1")!
  const u1Schematic = circuit.db.schematic_component
    .list()
    .find(
      (component) => component.source_component_id === u1.source_component_id,
    )!
  expect(
    circuit.db.schematic_trace
      .list()
      .some((trace) =>
        trace.edges.some(
          (edge) =>
            Math.abs(edge.from.x - edge.to.x) > 8 &&
            Math.min(edge.from.x, edge.to.x) < u1Schematic.center.x,
        ),
      ),
  ).toBe(false)
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  expectWiredInterface(circuit)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1600,
    height: 1250,
    grid: false,
  })
}, 20_000)
