import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MotorSpacer } from "./fixtures/motor-spacer"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("unanchored printed parts follow all six motor directions in emitted geometry", async () => {
  const panels = []
  for (const [direction, sceneAxis, sign] of [
    ["x+", 0, -1],
    ["x-", 0, 1],
    ["y+", 2, 1],
    ["y-", 2, -1],
    ["z+", 1, 1],
    ["z-", 1, -1],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.printedpart
          name="SPACER"
          jscad={<MotorSpacer />}
          mountedTo="MOTOR.backface"
          mountFace="motor"
          mountGap="2mm"
        />
        <assembly.motor
          name="MOTOR"
          model="nema17_backfaceholes"
          shaftFacingDirection={direction}
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const spacer = circuit.db.cad_component
      .list()
      .find((cad) => cad.model_jscad)!
    const motor = circuit.db.cad_component
      .list()
      .find((cad) => cad.model_glb_url)!
    const spacerBounds = await getRenderedMotorBounds([spacer])
    const motorBounds = await getRenderedMotorBounds([motor])
    const gap =
      sign === 1
        ? motorBounds.min[sceneAxis] - spacerBounds.max[sceneAxis]
        : spacerBounds.min[sceneAxis] - motorBounds.max[sceneAxis]
    expect(gap).toBeCloseTo(2, 3)
    expect(
      spacerBounds.max[sceneAxis] - spacerBounds.min[sceneAxis],
    ).toBeCloseTo(10, 3)
    panels.push({
      title: `Shaft ${direction} / unanchored spacer`,
      code: `<assembly.motor name="MOTOR"
  model="nema17_backfaceholes"
  shaftFacingDirection="${direction}" />
<assembly.printedpart name="SPACER"
  jscad={<MotorSpacer />}
  mountedTo="MOTOR.backface"
  mountFace="motor" mountGap="2mm" />`,
      annotation: "10 mm spacer / 2 mm surface gap / same camera in every view",
      circuit,
      renderOptions: { camPos: [-100, 90, 100] as [number, number, number] },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Printed parts follow full 3D attachment frames",
    panels,
    columns: 2,
  })
})
