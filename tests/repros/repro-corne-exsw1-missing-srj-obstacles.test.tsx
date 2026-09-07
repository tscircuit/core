import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reduced from left.circuit.tsx in https://tscircuit.com/imrishabh18/corne-keyboard
// (release 2.0.17). EXSW1's two mounting slots have no electrical port.
test.failing("Corne EXSW1 mounting pads are included in SRJ obstacles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={12} routingDisabled schematicDisabled>
      <chip
        name="EXSW1"
        layer="bottom"
        pcbRotation={-180}
        noSchematicRepresentation
        obstructsWithinBounds={false}
        footprint={
          <footprint originalLayer="bottom">
            {[-8, 8].map((pcbX) => (
              <Fragment key={pcbX}>
                <platedhole
                  shape="pill_hole_with_rect_pad"
                  pcbX={pcbX}
                  pcbRotation={90}
                  holeWidth={2.3}
                  holeHeight={1.5}
                  rectPadWidth={2.6}
                  rectPadHeight={2}
                  holeOffsetX={0}
                  holeOffsetY={0}
                  portHints={[""]}
                />
              </Fragment>
            ))}
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const mountingPads = circuit.db.pcb_plated_hole.list()
  expect(mountingPads).toHaveLength(2)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: circuit.db.pcb_board.list()[0].subcircuit_id,
  })

  const obstaclePadIds = simpleRouteJson.obstacles.map(
    (obstacle) => obstacle.circuitJsonMetadata?.pcb_plated_hole_id,
  )
  for (const pad of mountingPads) {
    expect(obstaclePadIds).toContain(pad.pcb_plated_hole_id)
  }
})
