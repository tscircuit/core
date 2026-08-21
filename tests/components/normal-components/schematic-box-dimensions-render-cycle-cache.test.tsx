import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const HIGH_PIN_COUNT = 129

test("schematic box dimensions are cached for one render cycle", () => {
  const { circuit } = getTestFixture()
  const pinLabels = Object.fromEntries(
    Array.from({ length: HIGH_PIN_COUNT }, (_, pinIndex) => {
      const pinNumber = pinIndex + 1
      return [`pin${pinNumber}`, `IO${pinNumber}`]
    }),
  )

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" pinLabels={pinLabels} />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip
  const firstDimensions = chip._getSchematicBoxDimensions()
  const cachedDimensions = chip._getSchematicBoxDimensions()

  expect(firstDimensions?.pinCount).toBe(HIGH_PIN_COUNT)
  expect(cachedDimensions).toBe(firstDimensions)

  circuit.render()

  const nextRenderCycleDimensions = chip._getSchematicBoxDimensions()
  expect(nextRenderCycleDimensions?.pinCount).toBe(HIGH_PIN_COUNT)
  expect(nextRenderCycleDimensions).not.toBe(firstDimensions)
})
