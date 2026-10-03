import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bend tear reliefs become edge cutouts before routing and survive 3D folding", async () => {
  const { circuit } = getTestFixture()
  let cutoutCountBeforeRouting = 0
  circuit.on("renderable:renderLifecycle:PcbTraceRender:start", () => {
    cutoutCountBeforeRouting = circuit.db.pcb_cutout.list().length
  })
  circuit.add(
    <board
      material="flex"
      thickness={0.15}
      width={20}
      height={10}
      schematicDisabled
      routingDisabled
    >
      <pcbbend
        x1={0}
        y1={-5}
        x2={0}
        y2={5}
        bendAngle={90}
        bendRadius={2}
        bendSide="right"
        tearReliefRadius="0.1cm"
      />
      <pcbnotetext
        text="1 mm tear reliefs at both bend ends"
        pcbY={-2.5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(cutoutCountBeforeRouting).toBe(2)
  const board = circuit.db.pcb_board.list()[0]!
  const cutouts = circuit.db.pcb_cutout.list()
  expect(cutouts).toMatchObject([
    {
      shape: "circle",
      radius: 1,
      center: { x: 0, y: -5 },
      pcb_board_id: board.pcb_board_id,
    },
    {
      shape: "circle",
      radius: 1,
      center: { x: 0, y: 5 },
      pcb_board_id: board.pcb_board_id,
    },
  ])
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  for (const y of [-5, 5]) {
    expect(
      simpleRouteJson.obstacles.some(
        (obstacle) =>
          Math.abs(obstacle.center.x) < 0.01 &&
          Math.abs(obstacle.center.y - y) < 1 &&
          obstacle.layers.includes("top") &&
          obstacle.layers.includes("bottom"),
      ),
    ).toBe(true)
  }
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showBendLines: true,
  })
  for (const foldPcbs of [false, true]) {
    await expect(circuit).toMatch3dSnapshot(import.meta.path, {
      snapshotSuffix: foldPcbs ? "folded" : "flat",
      gltf: { foldPcbs },
      poppygl: {
        width: 700,
        height: 500,
        camPos: [22, 28, 24],
        lookAt: [0, 2, 0],
        up: "y+",
        fov: 35,
        backgroundColor: "#f2f3f5",
        grid: undefined,
      },
    })
  }
})
