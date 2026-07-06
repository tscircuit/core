import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("schematic trace solver receives chip reference designator text boxes touching chip bodies", async () => {
  const { circuit } = getTestFixture()
  const solverStartedEvents: any[] = []

  circuit.on("solver:started", (event) => {
    solverStartedEvents.push(event)
  })

  circuit.add(
    <board>
      <chip name="U1" footprint="soic8" />
      <chip name="U2" footprint="soic8" />
      <trace from="U1.pin1" to="U2.pin1" name="SYNC" />
      <trace from="U1.pin2" to="U2.pin4" name="CS" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicTraceSolverEvent = solverStartedEvents.find(
    (event) => event.solverName === "SchematicTracePipelineSolver",
  )

  const solverParams = schematicTraceSolverEvent?.solverParams
  expect(solverParams).toBeDefined()
  expect(solverParams.textBoxes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ text: "U1" }),
      expect.objectContaining({ text: "U2" }),
    ]),
  )

  for (const textBox of solverParams.textBoxes) {
    if (textBox.text !== "U1" && textBox.text !== "U2") continue

    const chip = solverParams.chips.find(
      (chip: any) => chip.chipId === textBox.chipId,
    )
    expect(chip).toBeDefined()
    expect(textBox.center.y - textBox.height / 2).toBeCloseTo(
      chip.center.y + chip.height / 2,
    )
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
