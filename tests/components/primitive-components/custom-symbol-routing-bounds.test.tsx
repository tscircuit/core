import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing receives the drawn bounds of rotated custom symbols", async () => {
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
    // The off-center drawing, external text and asymmetric terminal positions
    // must not be replaced by the component's placement or a pin envelope.
    expect(chip.center).toEqual(rect.center)
    expect(chip.width).toBeCloseTo(expectedSizes[index][0])
    expect(chip.height).toBeCloseTo(expectedSizes[index][1])
    expect(chip).toMatchObject({
      bodyBounds: {
        minX: expect.closeTo(rect.center.x - expectedSizes[index][0] / 2, 8),
        maxX: expect.closeTo(rect.center.x + expectedSizes[index][0] / 2, 8),
        minY: expect.closeTo(rect.center.y - expectedSizes[index][1] / 2, 8),
        maxY: expect.closeTo(rect.center.y + expectedSizes[index][1] / 2, 8),
      },
    })
    expect(schematicComponent.center).toEqual(chip.center)
    expect(schematicComponent.size.width).toBeCloseTo(chip.width)
    expect(schematicComponent.size.height).toBeCloseTo(chip.height)
    for (const pin of chip.pins) {
      const port = circuit.db.schematic_port.get(pin.pinId)!
      expect({ x: pin.x, y: pin.y }).toEqual(port.center)
      expect(Math.abs(pin.x - chip.center.x)).toBeGreaterThan(chip.width / 2)
    }
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
