import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinrow2 makes the explosion collision checker skip the PCB substrate", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="PIN_HEADER_COLLISION">
      <board name="PCB" width={26} height={22} routingDisabled>
        <pinheader name="J1" pinCount={2} footprint="pinrow2" pcbX={7} />
        <pcbnoterect
          pcbX={-5}
          width={4}
          height={4}
          color="#facc15"
          isStrokeDashed
        />
        <pcbnotetext
          pcbX={-5}
          pcbY={3.5}
          text="PROBE SWEEPS THROUGH PCB"
          fontSize={0.65}
        />
        <pcbnotetext pcbX={7} pcbY={3.5} text="J1 PIN HEADER" fontSize={0.65} />
      </board>
      <assembly.printedpart
        name="PROBE"
        cadModel={{
          jscad: { type: "cuboid", size: [4, 4, 2] },
          positionOffset: { x: -5, y: 0, z: -5 },
        }}
      />
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="PROBE" offZ={10} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("incomplete")
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toMatchObject(
    [
      {
        reason: "unsupported_geometry",
        pcb_board_ids: [circuit.db.pcb_board.list()[0].pcb_board_id],
      },
    ],
  )
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
