import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("plated slots preserve copper geometry and connectivity on every board layer", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={40} height={20} layers={4} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).map((layer, row) =>
        [0, 90, 180, 270, 45].map((rotation, column) => (
          <chip
            key={`${layer}-${rotation}`}
            name={`${layer}_${rotation}`}
            layer={layer}
            pcbX={-16 + column * 8}
            pcbY={row === 0 ? 4 : -4}
            pinLabels={{ pin1: "SLOT" }}
            connections={{ pin1: "net.GND" }}
            footprint={
              <footprint>
                <platedhole
                  shape="pill_hole_with_rect_pad"
                  pcbRotation={rotation}
                  holeWidth={2.3}
                  holeHeight={1.5}
                  rectPadWidth={4}
                  rectPadHeight={2}
                  holeOffsetX={0.2}
                  portHints={["pin1"]}
                />
              </footprint>
            }
          />
        )),
      )}
      <pcbnotetext
        text="Slots: 0 / 90 / 180 / 270 / 45 degrees; top and bottom"
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  const pads = circuit.db.pcb_plated_hole.list()
  expect(pads).toHaveLength(10)
  expect(pads.some((pad) => pad.shape === "pill_hole_with_rect_pad")).toBe(true)
  const groundNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "GND")!
  for (const pad of pads) {
    if (
      pad.shape !== "pill_hole_with_rect_pad" &&
      pad.shape !== "rotated_pill_hole_with_rect_pad"
    ) {
      throw new Error(`Unexpected pad shape: ${pad.shape}`)
    }
    const obstacles = simpleRouteJson.obstacles.filter(
      (obstacle) =>
        obstacle.circuitJsonMetadata?.pcb_plated_hole_id ===
        pad.pcb_plated_hole_id,
    )
    expect(obstacles).toHaveLength(1)
    const obstacle = obstacles[0]
    const rotation =
      pad.shape === "rotated_pill_hole_with_rect_pad"
        ? pad.rect_ccw_rotation
        : 0
    const normalizedRotation = ((rotation % 360) + 360) % 360
    const isVertical = normalizedRotation === 90 || normalizedRotation === 270
    expect(obstacle).toMatchObject({
      type: "rect",
      center: { x: pad.x, y: pad.y },
      width: isVertical ? pad.rect_pad_height : pad.rect_pad_width,
      height: isVertical ? pad.rect_pad_width : pad.rect_pad_height,
      layers: ["top", "inner1", "inner2", "bottom"],
      componentId: pad.pcb_component_id,
      circuitJsonMetadata: {
        pcb_port_id: pad.pcb_port_id,
        source_port_name: "SLOT",
      },
    })
    expect(obstacle.ccwRotationDegrees).toBe(
      normalizedRotation % 90 === 0 ? undefined : rotation,
    )
    expect(obstacle.connectedTo).toContain(pad.pcb_plated_hole_id)
    expect(obstacle.connectedTo).toContain(groundNet.source_net_id)
  }
})
