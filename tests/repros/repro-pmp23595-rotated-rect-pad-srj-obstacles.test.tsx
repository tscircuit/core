import { expect, test } from "bun:test"
import type { PcbHoleCircularWithRectPad } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pmp23595PlatedHolePlacements = [
  {
    name: "T502",
    pcbX: -8.5598,
    pcbY: -27.1526,
    pcbRotation: 90,
    holeOffsetY: -2.286,
  },
  {
    name: "T500",
    pcbX: 8.5598,
    pcbY: -27.2796,
    pcbRotation: 90,
    holeOffsetY: -2.286,
  },
  {
    name: "T503",
    pcbX: -8.1534,
    pcbY: 27.2034,
    pcbRotation: 270,
    holeOffsetY: 2.286,
  },
  {
    name: "T501",
    pcbX: 8.1534,
    pcbY: 27.2288,
    pcbRotation: 270,
    holeOffsetY: 2.286,
  },
] as const

// Reduced from TI PMP23595. These four transformer pads reproduce the two
// pairs that overlap in SRJ when their quarter-turn rotations are ignored.
test("PMP23595 rotated rectangular plated-hole pads preserve their SRJ gap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={45} height={75} routingDisabled schematicDisabled>
      {pmp23595PlatedHolePlacements.map(
        ({ name, pcbX, pcbY, pcbRotation, holeOffsetY }) => (
          <chip
            key={name}
            name={name}
            pcbX={pcbX}
            pcbY={pcbY}
            noSchematicRepresentation
            obstructsWithinBounds={false}
            footprint={
              <footprint>
                <platedhole
                  shape="circular_hole_with_rect_pad"
                  holeDiameter={6.4516}
                  holeOffsetY={holeOffsetY}
                  rectPadWidth={17.272}
                  rectPadHeight={12.7}
                  pcbRotation={pcbRotation}
                  portHints={["pin1"]}
                />
              </footprint>
            }
          />
        ),
      )}
      <pcbnotetext
        text="PMP23595: 90/270deg pads retain 4.4196/3.6068mm gaps"
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const rectangularPlatedHoles = circuit.db.pcb_plated_hole
    .list()
    .filter(
      (platedHole): platedHole is PcbHoleCircularWithRectPad =>
        platedHole.shape === "circular_hole_with_rect_pad",
    )
    .sort(
      (leftPlatedHole, rightPlatedHole) =>
        (leftPlatedHole.rect_ccw_rotation ?? 0) -
          (rightPlatedHole.rect_ccw_rotation ?? 0) ||
        leftPlatedHole.x - rightPlatedHole.x,
    )

  expect(rectangularPlatedHoles).toHaveLength(4)
  expect(
    rectangularPlatedHoles.map(({ rect_ccw_rotation }) => rect_ccw_rotation),
  ).toEqual([90, 90, 270, 270])

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
  })
  const platedHoleObstacles = rectangularPlatedHoles.map((platedHole) => {
    const obstacle = simpleRouteJson.obstacles.find(
      ({ circuitJsonMetadata }) =>
        circuitJsonMetadata?.pcb_plated_hole_id ===
        platedHole.pcb_plated_hole_id,
    )
    if (!obstacle) {
      throw new Error(
        `Missing SRJ obstacle for ${platedHole.pcb_plated_hole_id}`,
      )
    }
    return obstacle
  })

  for (const obstacle of platedHoleObstacles) {
    expect(obstacle.width).toBeCloseTo(12.7, 6)
    expect(obstacle.height).toBeCloseTo(17.272, 6)
    expect(obstacle.ccwRotationDegrees).toBeUndefined()
  }

  const [
    ninetyDegreeLeftObstacle,
    ninetyDegreeRightObstacle,
    twoSeventyDegreeLeftObstacle,
    twoSeventyDegreeRightObstacle,
  ] = platedHoleObstacles
  const ninetyDegreeSrjGap =
    ninetyDegreeRightObstacle!.center.x -
    ninetyDegreeRightObstacle!.width / 2 -
    (ninetyDegreeLeftObstacle!.center.x + ninetyDegreeLeftObstacle!.width / 2)
  const twoSeventyDegreeSrjGap =
    twoSeventyDegreeRightObstacle!.center.x -
    twoSeventyDegreeRightObstacle!.width / 2 -
    (twoSeventyDegreeLeftObstacle!.center.x +
      twoSeventyDegreeLeftObstacle!.width / 2)
  expect(ninetyDegreeSrjGap).toBeCloseTo(4.4196, 6)
  expect(twoSeventyDegreeSrjGap).toBeCloseTo(3.6068, 6)
})
