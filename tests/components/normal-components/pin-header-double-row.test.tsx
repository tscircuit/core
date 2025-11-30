import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader doubleRow generates a two-row footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader
        name="J1"
        pinCount={6}
        doubleRow
        pitch="2.54mm"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  const roundedYLevels = new Set(
    platedHoles.map((hole) => Number(hole.y.toFixed(5))),
  )

  expect(platedHoles).toHaveLength(6)
  expect(roundedYLevels.size).toBe(2)

  const countsByRow = Array.from(roundedYLevels).map(
    (yLevel) =>
      platedHoles.filter((hole) => Number(hole.y.toFixed(5)) === yLevel).length,
  )

  expect(countsByRow).toEqual([3, 3])
})
