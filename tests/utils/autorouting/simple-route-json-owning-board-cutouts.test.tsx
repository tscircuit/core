import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested routing inherits only its owning board's cutouts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={80} height={30}>
      <board name="FIRST" width={30} height={24} routingDisabled>
        <cutout shape="rect" width={1} height={2} pcbX={-6} />
      </board>
      <board name="SECOND" width={30} height={24} layers={4} routingDisabled>
        <group pcbRotation={30}>
          <cutout shape="rect" width={2} height={3} pcbX={-5} pcbY={1} />
        </group>
        <group name="Wrapper" subcircuit pcbX={3} pcbY={2}>
          <group name="Target" subcircuit pcbX={1} pcbY={1}>
            <cutout shape="rect" width={3} height={4} />
            <group name="Descendant" subcircuit>
              <cutout shape="rect" width={4} height={5} pcbX={2} />
            </group>
          </group>
        </group>
        <group name="Sibling" subcircuit>
          <cutout shape="rect" width={5} height={6} pcbX={5} />
        </group>
        <chip
          name="ParentPad"
          footprint={
            <footprint>
              <smtpad shape="rect" width={9} height={1} />
            </footprint>
          }
        />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  const target = circuit.db.source_group.getWhere({ name: "Target" })!
  const secondBoard = circuit.db.pcb_board
    .list()
    .find((board) => board.num_layers === 4)!
  const convert = (subcircuit_id?: string) =>
    getSimpleRouteJsonFromCircuitJson({ db: circuit.db, subcircuit_id })
      .simpleRouteJson
  const nested = convert(target.subcircuit_id)

  // Widths include the default 0.2 mm board-edge keepout on each side.
  // Parent electrical geometry is not inflated or imported into the child.
  expect(nested.obstacles.map((obstacle) => obstacle.width).sort()).toEqual([
    2.4, 3.4, 4.4,
  ])
  for (const width of [2, 3, 4]) {
    const cutout = circuit.db.pcb_cutout
      .list()
      .filter((cutout) => cutout.shape === "rect")
      .find((cutout) => cutout.width === width)!
    expect(nested.obstacles).toContainEqual(
      expect.objectContaining({
        center: cutout.center,
        width: width + 0.4,
        height: width + 1.4,
        ccwRotationDegrees: cutout.rotation,
        layers: ["top", "inner1", "inner2", "bottom"],
        connectedTo: [],
      }),
    )
  }
  // Board-scoped and unscoped conversion must not duplicate cutouts.
  expect(
    convert(secondBoard.subcircuit_id)
      .obstacles.map((obstacle) => obstacle.width)
      .sort(),
  ).toEqual([2.4, 3.4, 4.4, 5.4, 9])
  expect(
    convert()
      .obstacles.map((obstacle) => obstacle.width)
      .sort(),
  ).toEqual([1.4, 2.4, 3.4, 4.4, 5.4, 9])
})
