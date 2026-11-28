import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("combined plated-hole shapes preserve PCB explosion collision checking and drill cutouts", async () => {
  const { circuit: blockedCircuit } = getTestFixture()
  blockedCircuit.add(
    <assembly.device name="PINROW_PCB_BLOCKED">
      <board width={20} height={14} routingDisabled schematicDisabled>
        <pinheader name="J1" pinCount={2} footprint="pinrow2" pcbX={-6} />
        <chip
          name="U1"
          pcbX={6}
          pcbRotation={45}
          cadModel={{ jscad: { type: "cube", size: 1 } }}
          footprint={
            <footprint>
              <platedhole
                portHints={["1"]}
                shape="pill_hole_with_rect_pad"
                holeWidth={1.2}
                holeHeight={2.6}
                rectPadWidth={2}
                rectPadHeight={3.4}
                pcbY={2.5}
              />
              <platedhole
                portHints={["2"]}
                shape="hole_with_polygon_pad"
                holeShape="circle"
                holeDiameter={1.2}
                holeOffsetX={0}
                holeOffsetY={0}
                padOutline={[
                  { x: -1, y: -1 },
                  { x: 1, y: -1 },
                  { x: 1, y: 1 },
                  { x: -1, y: 1 },
                ]}
                pcbY={-2.5}
              />
            </footprint>
          }
        />
      </board>
      <assembly.printedpart
        name="PROBE"
        color="#d9534f"
        cadModel={{
          jscad: { type: "cube", size: 4 },
          positionOffset: { x: 0, y: 0, z: -5 },
        }}
      />
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="PROBE" offZ={10} />
      </assembly.explosion.stage>
    </assembly.device>,
  )

  await blockedCircuit.renderUntilSettled()

  expect(getAssemblyExplosion(blockedCircuit).collisionCheckStatus).toBe(
    "checked",
  )
  expect(
    blockedCircuit.db.cad_explosion_collision_check_warning.list(),
  ).toHaveLength(0)
  const errors = blockedCircuit.db.cad_explosion_collision_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.obstacle).toEqual({
    type: "pcb_board",
    pcb_board_id: blockedCircuit.db.pcb_board.list()[0]!.pcb_board_id,
  })
  await expect(blockedCircuit).toMatchPcbSnapshot(import.meta.path)

  // Verify rotated pill_hole_with_rect_pad cutouts honor hole_ccw_rotation:
  // a 0.8mm x 2.2mm bar rotated 45deg passes cleanly through a 45deg 1.4mm x 3.0mm pill drill,
  // whereas an unrotated 0deg drill loop would intersect the 45deg bar.
  const { circuit: clearRotatedSlotCircuit } = getTestFixture()
  clearRotatedSlotCircuit.add(
    <assembly.device name="ROTATED_PILL_SLOT_CLEAR">
      <board width={16} height={16} routingDisabled schematicDisabled>
        <chip
          name="J_SLOT"
          pcbRotation={45}
          cadModel={null}
          footprint={
            <footprint>
              <platedhole
                portHints={["1"]}
                shape="pill_hole_with_rect_pad"
                holeWidth={1.4}
                holeHeight={3.2}
                rectPadWidth={2.2}
                rectPadHeight={4}
              />
            </footprint>
          }
        />
      </board>
      <assembly.printedpart
        name="TAB"
        cadModel={{
          jscad: { type: "cuboid", size: [0.8, 2.2, 2] },
          rotationOffset: { x: 0, y: 0, z: 45 },
          positionOffset: { x: 0, y: 0, z: -5 },
        }}
      />
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="TAB" offZ={10} />
      </assembly.explosion.stage>
    </assembly.device>,
  )

  await clearRotatedSlotCircuit.renderUntilSettled()
  expect(
    clearRotatedSlotCircuit.db.cad_explosion_collision_check_warning.list(),
  ).toHaveLength(0)
  expect(
    clearRotatedSlotCircuit.db.cad_explosion_collision_error.list(),
  ).toHaveLength(0)
})
