import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("motor orientation follows the mounted board's non-cardinal PCB rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.motor
        name="MOTOR"
        standard="nema17"
        shaftFacingDirection="z-"
      />
      <board
        name="B1"
        width={42}
        height={42}
        pcbRotation={30}
        mountedTo="MOTOR.backface"
        mountGap={6}
        routingDisabled
      >
        <hole diameter={3.2} pcbX={-15.5} pcbY={-15.5} />
        <hole diameter={3.2} pcbX={-15.5} pcbY={15.5} />
        <hole diameter={3.2} pcbX={15.5} pcbY={-15.5} />
        <hole diameter={3.2} pcbX={15.5} pcbY={15.5} />
        <pcbnotetext text="30 degree rear mount" pcbY={23} fontSize={1} />
      </board>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const motor = circuit.db.cad_component.list()[0]!
  // Read the board's actual hole direction. A bottom-side Y flip negates
  // local X, pairing with renderAssemblyCadModel's opposite Z rotation.
  const holes = circuit.db.pcb_hole.list()
  const axis = { x: holes[2]!.x - holes[0]!.x, y: holes[2]!.y - holes[0]!.y }
  const boardAngle = (Math.atan2(axis.y, axis.x) * 180) / Math.PI
  expect(motor.rotation!.y).toBe(180)
  expect(motor.rotation!.z).toBeCloseTo((360 - boardAngle) % 360)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [100, 80, 100],
    poppygl: { lookAt: [0, -20, 0], grid: false, backgroundColor: [1, 1, 1] },
  })
})
