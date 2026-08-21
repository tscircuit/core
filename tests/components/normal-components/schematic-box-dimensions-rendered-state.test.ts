import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const HIGH_PIN_COUNT = 129

class SchematicBoxDimensionCountingChip extends Chip {
  schematicBoxDimensionsComputationCount = 0

  override _computeSchematicBoxDimensions() {
    this.schematicBoxDimensionsComputationCount++
    return super._computeSchematicBoxDimensions()
  }
}

test("schematic ports reuse dimensions rendered by their component", () => {
  const { circuit } = getTestFixture()
  const pinLabels = Object.fromEntries(
    Array.from({ length: HIGH_PIN_COUNT }, (_, pinIndex) => {
      const pinNumber = pinIndex + 1
      return [`pin${pinNumber}`, `IO${pinNumber}`]
    }),
  )
  const board = new Board({ width: "20mm", height: "20mm" })
  const chip = new SchematicBoxDimensionCountingChip({
    name: "U1",
    pinLabels,
  })
  board.add(chip)
  circuit.add(board)

  circuit.render()

  expect(chip.schematicBoxDimensionsComputationCount).toBe(1)
  expect(chip.schematicBoxDimensions?.pinCount).toBe(HIGH_PIN_COUNT)
  expect(chip._getSchematicBoxDimensions()).toBe(chip.schematicBoxDimensions)

  circuit.render()

  expect(chip.schematicBoxDimensionsComputationCount).toBe(1)
})
