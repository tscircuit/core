import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four-pin crystal text does not expand its trace obstacle", async () => {
  const { circuit } = getTestFixture()
  let solverInputProblem: InputProblem | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      solverInputProblem = structuredClone(event.solverParams as InputProblem)
    }
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="Y1"
        schSectionName="clocks"
        frequency="24MHz"
        loadCapacitance="20pF"
        pinVariant="four_pin"
        footprint="0402"
        connections={{
          pin1: "net.A1",
          pin2: "net.GND",
          pin3: "net.A0",
          pin4: "net.GND",
        }}
      />
      <capacitor
        name="C3"
        schSectionName="clocks"
        capacitance="20pF"
        footprint="0402"
        connections={{ pin1: "net.A1", pin2: "net.GND" }}
      />
      <capacitor
        name="C4"
        schSectionName="clocks"
        capacitance="20pF"
        footprint="0402"
        connections={{ pin1: "net.A0", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const crystalSourceComponent = circuit.db.source_component.getWhere({
    name: "Y1",
  })!
  const crystalComponent = circuit.db.schematic_component.getWhere({
    source_component_id: crystalSourceComponent.source_component_id,
  })!
  const crystalSolverChip = solverInputProblem?.chips.find(
    (chip) => chip.chipId === crystalComponent.schematic_component_id,
  )!
  const crystalTextBoxes = solverInputProblem?.textBoxes?.filter(
    (textBox) => textBox.chipId === crystalComponent.schematic_component_id,
  )

  expect(crystalSolverChip.width).toBe(crystalComponent.size.width)
  expect(crystalSolverChip.height).toBe(crystalComponent.size.height)
  expect(crystalTextBoxes).toHaveLength(2)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
