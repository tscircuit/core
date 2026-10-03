import { expect, test } from "bun:test"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named symbols supply drawn body bounds, separate text, and actual terminals at every cardinal rotation", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <group>
      {[0, 90, 180, 270].map((rotation, index) => (
        <resistor
          key={rotation}
          name={`R_LONG_REFERENCE_${rotation}`}
          resistance="100k"
          schX={index * 5}
          schY={0}
          schRotation={rotation}
        />
      ))}
    </group>,
  )
  await circuit.renderUntilSettled()
  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  const solver = new SchematicTracePipelineSolver(inputProblem)
  for (const chip of inputProblem.chips) {
    const ports = circuit.db.schematic_port.list({
      schematic_component_id: chip.chipId,
    })
    const component = circuit.db.schematic_component.get(chip.chipId)!
    const source = circuit.db.source_component.get(
      component.source_component_id!,
    )!
    const text = inputProblem.textBoxes!.find(
      (box) => box.text === source.name,
    )!
    expect(text.chipId).toBe(chip.chipId)
    const horizontal = Math.abs(ports[0]!.center.y - ports[1]!.center.y) < 1e-8
    expect(horizontal ? chip.width : chip.height).toBeCloseTo(0.6)
    expect(horizontal ? chip.height : chip.width).toBeCloseTo(0.15996)
    expect(chip.width * chip.height).toBeLessThan(
      component.size.width * component.size.height,
    )
    expect(
      solver.inputProblem.chips.find((c) => c.chipId === chip.chipId),
    ).toEqual(chip)
    for (const pin of chip.pins) {
      const port = ports.find((port) => port.schematic_port_id === pin.pinId)!
      expect({ x: pin.x, y: pin.y }).toEqual(port.center)
      expect(
        horizontal
          ? Math.abs(pin.x - chip.center.x)
          : Math.abs(pin.y - chip.center.y),
      ).toBeCloseTo(0.3)
    }
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
