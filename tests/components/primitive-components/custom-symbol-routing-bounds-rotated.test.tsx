import { expect, test } from "bun:test"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated custom symbols retain body bounds and asymmetric external terminals", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <group>
      {[0, 90, 180, 270].map((rotation, index) => (
        <chip
          key={rotation}
          name={`U${index + 1}`}
          schX={(index % 2) * 7}
          schY={-Math.floor(index / 2) * 7}
          schRotation={rotation}
          pinLabels={{ pin1: "SIGNAL", pin2: "NC" }}
          noConnect={["NC"]}
          connections={{ SIGNAL: `net.SIGNAL_${rotation}` }}
          symbol={
            <symbol>
              <schematicrect schX={0} schY={0} width={1} height={0.5} />
              <schematictext
                schX={0}
                schY={0.5}
                fontSize={0.15}
                text={`${rotation} degrees`}
              />
              <port
                name="SIGNAL"
                pinNumber={1}
                direction="left"
                schX={-1}
                schY={0}
                schStemLength={0.5}
              />
              <port
                name="NC"
                pinNumber={2}
                direction="right"
                schX={3}
                schY={0.1}
                schStemLength={2.5}
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
  expect(solver.inputProblem.chips).toHaveLength(4)
  for (const chip of solver.inputProblem.chips) {
    const schematicComponent = circuit.db.schematic_component.get(chip.chipId)!
    expect(chip.center).toEqual(schematicComponent.center)
    expect(chip.width).toBeCloseTo(schematicComponent.size.width)
    expect(chip.height).toBeCloseTo(schematicComponent.size.height)
    for (const pin of chip.pins) {
      const port = circuit.db.schematic_port.get(pin.pinId)!
      expect(pin.x).toBeCloseTo(port.center.x)
      expect(pin.y).toBeCloseTo(port.center.y)
      const rawPin = inputProblem.chips
        .flatMap((chip) => chip.pins)
        .find((rawPin) => rawPin.pinId === pin.pinId)!
      expect(pin._facingDirection).toBe(rawPin._facingDirection)
      const line = circuit.db.schematic_line
        .list()
        .find((line) => line.x1 === port.center.x && line.y1 === port.center.y)!
      expect(pin.stemEnd).toEqual({ x: line.x2, y: line.y2 })
    }
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
