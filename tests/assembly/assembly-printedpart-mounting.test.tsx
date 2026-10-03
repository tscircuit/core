import { expect, test } from "bun:test"
import { Fragment } from "react"
import modeling from "@jscad/modeling"
import { executeJscadOperations, type JscadOperation } from "jscad-planner"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MotorSpacer, holeCenters } from "./fixtures/motor-spacer"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("printed spacers mate named faces between motor and unchanged PCB geometry", async () => {
  const panels = []
  for (const [direction, pcbRotation, height] of [
    ["z+", 0, 10],
    ["z+", 90, 18],
    ["z-", 180, 10],
    ["z-", 270, 18],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <board
          name="CONTROL"
          width={42}
          height={42}
          thickness={1.6}
          routingDisabled
          mountedTo="SPACER.board"
          mountGap="2mm"
          pcbX={10}
          pcbY={-7}
          pcbRotation={pcbRotation}
        >
          {holeCenters.map(([x, y]) => (
            <Fragment key={`${x},${y}`}>
              <hole diameter={3.2} pcbX={x} pcbY={y} />
            </Fragment>
          ))}
          <resistor
            name="R1"
            footprint="0402"
            resistance="1k"
            pcbX={5}
            pcbY={3}
          />
        </board>
        <assembly.printedpart
          name="SPACER"
          mountedTo="MOTOR.backface"
          mountFace="motor"
          mountGap="1mm"
          jscad={<MotorSpacer height={height} />}
        />
        <assembly.motor
          name="MOTOR"
          model="nema17_backfaceholes"
          shaftFacingDirection={direction}
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const board = circuit.db.pcb_board.list()[0]!
    expect(board.center).toEqual({ x: 10, y: -7 })
    const spacer = circuit.db.cad_component
      .list()
      .find((cad) => cad.model_jscad)!
    const motor = circuit.db.cad_component
      .list()
      .find((cad) => cad.model_glb_url?.includes("nema17"))!
    expect(JSON.stringify(spacer.model_jscad)).not.toContain('"reference"')
    const solid = modeling.transforms.translate(
      [spacer.position.x, spacer.position.y, spacer.position.z],
      executeJscadOperations(
        modeling as any,
        spacer.model_jscad as JscadOperation,
      ),
    )
    const [min, max] = modeling.measurements.measureBoundingBox(solid)
    expect(max[2] - min[2]).toBeCloseTo(height, 5)
    expect(direction === "z+" ? min[2] - 0.8 : -max[2] - 0.8).toBeCloseTo(2, 5)
    // Probe emitted solid at the actual PCB holes: catches misaligned assembly
    // rotations/translations without restating the placement transform.
    for (const hole of circuit.db.pcb_hole.list()) {
      const probe = modeling.primitives.cylinder({
        radius: 1.5,
        height: height + 2,
        center: [hole.x, hole.y, (min[2] + max[2]) / 2],
      })
      expect(
        modeling.measurements.measureVolume(
          modeling.booleans.intersect(solid, probe),
        ),
      ).toBeCloseTo(0, 5)
    }
    const motorBounds = await getRenderedMotorBounds([motor])
    const motorRear =
      direction === "z+" ? motorBounds.min[1] : motorBounds.max[1]
    expect(
      direction === "z+" ? motorRear - max[2] : min[2] - motorRear,
    ).toBeCloseTo(1, 2)
    const spacerBounds = await getRenderedMotorBounds([spacer])
    expect(spacerBounds.min[1]).toBeCloseTo(min[2], 4)
    expect(spacerBounds.max[1]).toBeCloseTo(max[2], 4)
    panels.push({
      title: `${direction} shaft / ${pcbRotation}° PCB / ${height} mm spacer`,
      code: `<assembly.device>
  <board mountedTo="SPACER.board"
    mountGap="2mm"
    pcbRotation={${pcbRotation}} ... />
  <assembly.printedpart
    name="SPACER"
    mountedTo="MOTOR.backface"
    mountFace="motor" mountGap="1mm"
    jscad={<MotorSpacer height={${height}} />}
  />
  <assembly.motor name="MOTOR"
    model="nema17_backfaceholes"
    shaftFacingDirection="${direction}" />
</assembly.device>`,
      annotation: `4 mm plate / four M3 clearance holes / 30 mm center opening / 1 mm motor gap / 2 mm PCB gap`,
      circuit,
      renderOptions: {
        camPos: [100, direction === "z+" ? 100 : -100, 110] as [
          number,
          number,
          number,
        ],
        poppygl: {
          lookAt: [-10, direction === "z+" ? 25 : -25, -7] as [
            number,
            number,
            number,
          ],
        },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Motor -> named spacer faces -> PCB",
    panels,
  })
})
