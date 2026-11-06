import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole supports holeDiameter alias and skips invalid hole_diameter obstacles", async () => {
  const { circuit } = getTestFixture()

  const HoleAny = "hole" as any
  circuit.add(
    <board width="10mm" height="10mm">
      <HoleAny holeDiameter="1.2mm" pcbX={1} pcbY={2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const holes = circuit.db.pcb_hole.list()
  expect(holes).toHaveLength(1)
  const hole = holes[0]
  expect(hole.hole_shape).toBe("circle")
  if (hole.hole_shape === "circle") {
    expect(hole.hole_diameter).toBeCloseTo(1.2, 5)
  }

  const obstacles = getObstaclesFromCircuitJson([
    ...circuit.getCircuitJson(),
    {
      type: "pcb_hole",
      pcb_hole_id: "invalid_hole",
      hole_shape: "circle",
      hole_diameter: Number.NaN,
      x: 0,
      y: 0,
    },
  ])
  expect(
    obstacles.every(
      (obs) => Number.isFinite(obs.width) && Number.isFinite(obs.height),
    ),
  ).toBe(true)
})
