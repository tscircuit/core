import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing includes custom symbol terminals while preserving rotated body bounds", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const rotations = [0, 45, 90, 180, 270]
  circuit.add(
    <board>
      {rotations.map((rotation, index) => (
        <chip
          key={rotation}
          name={`U${index + 1}`}
          schX={index * 6}
          schY={3}
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
                text={`{NAME}: ${rotation} degrees`}
                schX={1}
                schY={2}
                fontSize={0.2}
              />
              <port
                name="SIGNAL"
                pinNumber={1}
                direction="left"
                schX={-1}
                schY={0}
              />
              <port
                name="NC"
                pinNumber={2}
                direction="right"
                schX={4}
                schY={0}
              />
            </symbol>
          }
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  expect(inputProblem.chips).toHaveLength(rotations.length)
  const expectedSizes = [
    [2, 1],
    [3 / Math.sqrt(2), 3 / Math.sqrt(2)],
    [1, 2],
    [2, 1],
    [1, 2],
  ]
  for (const [index, chip] of inputProblem.chips.entries()) {
    const rect = circuit.db.schematic_rect.getWhere({
      schematic_component_id: chip.chipId,
    })!
    const schematicComponent = circuit.db.schematic_component.get(chip.chipId)!
    // World-space points and AABB dimensions in mm, +X right and +Y up.
    // The component retains its off-center drawn body. Only the solver obstacle
    // expands to the asymmetric terminals; the external text stays separate.
    expect(schematicComponent.center).toEqual(rect.center)
    expect(schematicComponent.size.width).toBeCloseTo(expectedSizes[index][0])
    expect(schematicComponent.size.height).toBeCloseTo(expectedSizes[index][1])
    expect(chip.center).toEqual({ x: rect.center.x + 0.5, y: rect.center.y })
    expect(chip.width).toBeCloseTo(5)
    expect(chip.height).toBeCloseTo(expectedSizes[index][1])
    for (const pin of chip.pins) {
      const port = circuit.db.schematic_port.get(pin.pinId)!
      expect({ x: pin.x, y: pin.y }).toEqual(port.center)
      expect(Math.abs(pin.x - chip.center.x)).toBeCloseTo(chip.width / 2)
    }
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
