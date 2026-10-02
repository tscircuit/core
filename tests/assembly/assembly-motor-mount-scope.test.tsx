import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("identical motor names in sibling devices resolve within each device", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="product">
      <assembly.device name="left">
        <assembly.motor
          name="MOTOR"
          standard="nema8"
          shaftFacingDirection="z-"
        />
        <board
          name="B1"
          width={24}
          height={24}
          thickness={2}
          pcbX={-45}
          mountedTo="MOTOR.backface"
          mountGap={3}
          routingDisabled
        />
      </assembly.device>
      <assembly.device name="right">
        <board
          name="B2"
          width={58}
          height={58}
          thickness={2}
          pcbX={45}
          mountedTo="MOTOR.backface"
          mountGap={8}
          routingDisabled
        />
        <assembly.motor name="MOTOR" standard="nema23" />
      </assembly.device>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const motors = circuit.db.cad_component.list()
  expect(
    motors.find((cad) => cad.model_glb_url?.includes("nema8"))?.position,
  ).toEqual({ x: -45, y: 0, z: -37 })
  expect(
    motors.find((cad) => cad.model_glb_url?.includes("nema23"))?.position,
  ).toEqual({ x: 45, y: 0, z: 60 })
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [190, 160, 190],
    poppygl: { lookAt: [0, 10, 0], grid: false, backgroundColor: [1, 1, 1] },
  })
})
