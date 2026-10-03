import { expect, test } from "bun:test"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol obstacles follow rotated drawing geometry independently of text and terminals", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <group>
      {[0, 45, 90, 180, 270].map((rotation, index) => (
        <chip
          key={rotation}
          name={`U${index + 1}`}
          schX={index * 8}
          schY={0}
          pinLabels={{ pin1: "SIGNAL", pin2: "NC" }}
          noConnect={["NC"]}
          symbol={
            <symbol>
              <schematicrect
                schX={1}
                schY={0}
                width={2}
                height={1}
                rotation={rotation}
              />
              <schematictext
                schX={1}
                schY={2}
                text={`Body ${rotation}`}
                fontSize={0.2}
              />
              <port
                name="SIGNAL"
                pinNumber={1}
                schX={-2}
                schY={0}
                direction="left"
                schStemLength={2}
              />
              <port
                name="NC"
                pinNumber={2}
                schX={5}
                schY={0}
                direction="right"
                schStemLength={3}
              />
            </symbol>
          }
        />
      ))}
    </group>,
  )
  await circuit.renderUntilSettled()
  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  const solver = new SchematicTracePipelineSolver(inputProblem)
  for (const [index, chip] of inputProblem.chips.entries()) {
    const rect = circuit.db.schematic_rect
      .list()
      .find((rect) => rect.schematic_component_id === chip.chipId)!
    const [width, height] = [
      [2, 1],
      [3 / Math.sqrt(2), 3 / Math.sqrt(2)],
      [1, 2],
      [2, 1],
      [1, 2],
    ][index]!
    expect(chip.center.x).toBeCloseTo(rect.center.x)
    expect(chip.center.y).toBeCloseTo(rect.center.y)
    expect(chip.width).toBeCloseTo(width!)
    expect(chip.height).toBeCloseTo(height!)
    const text = circuit.db.schematic_text
      .list()
      .find((text) => text.text === `Body ${[0, 45, 90, 180, 270][index]}`)!
    const textBox = inputProblem.textBoxes!.find(
      (box) => box.text === text.text,
    )!
    expect(textBox.chipId).toBe(chip.chipId)
    expect(textBox.center.x).toBeCloseTo(text.position.x)
    expect(textBox.center.y).toBeCloseTo(text.position.y)
    expect(textBox.center.y - textBox.height / 2).toBeGreaterThan(
      chip.center.y + chip.height / 2,
    )
    expect(solver.inputProblem.chips[index]).toEqual(chip)
    for (const pin of chip.pins) {
      const port = circuit.db.schematic_port.get(pin.pinId)!
      expect({ x: pin.x, y: pin.y }).toEqual(port.center)
    }
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
