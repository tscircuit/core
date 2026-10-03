import { expect, test } from "bun:test"
import { assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import type { BoardProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

const MotorController = (props: BoardProps) => (
  <board width={42} height={42} thickness={1.6} routingDisabled {...props}>
    <hole diameter={3.2} pcbX={-15.5} pcbY={-15.5} />
    <hole diameter={3.2} pcbX={-15.5} pcbY={15.5} />
    <hole diameter={3.2} pcbX={15.5} pcbY={-15.5} />
    <hole diameter={3.2} pcbX={15.5} pcbY={15.5} />
    <resistor name="R1" footprint="0402" resistance="1k" pcbX={5} pcbY={3} />
    <pcbnotetext
      text="NEMA17 rear mount: 6 mm clearance"
      pcbY={23}
      fontSize={1}
    />
  </board>
)

test("board backface mounts preserve PCB geometry and leave a 6 mm surface gap", async () => {
  const panels = []
  for (const direction of ["z+", "z-"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        {/* Forward reference: board is rendered before the motor. */}
        <MotorController
          mountedTo="NEMA17.backface"
          mountGap="6mm"
          pcbX={10}
          pcbY={-7}
        />
        <assembly.motor
          name="NEMA17"
          model="nema17_backfaceholes"
          shaftFacingDirection={direction}
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const board = circuit.db.pcb_board.list()[0]!
    expect(board.center).toEqual({ x: 10, y: -7 })
    const motor = circuit.db.cad_component
      .list()
      .find((cad) => cad.model_glb_url?.includes("nema17"))!
    expect(motor.position.x).toBe(board.center.x)
    expect(motor.position.y).toBe(board.center.y)
    // Measure the actual rotated GLB rear face, not the placement formula.
    const bounds = await getRenderedMotorBounds(
      circuit
        .getCircuitJson()
        .filter(
          (el) =>
            el.type === "cad_component" &&
            el.cad_component_id === motor.cad_component_id,
        ),
    )
    const rearZ = direction === "z+" ? bounds.min[1]! : bounds.max[1]!
    expect(Math.abs(rearZ) - board.thickness / 2).toBeCloseTo(6, 2)
    expect(
      circuit.db.pcb_hole
        .list()
        .map((hole) => hole.x)
        .sort((a, b) => a - b),
    ).toEqual([-5.5, -5.5, 25.5, 25.5])
    expect(circuit.db.pcb_component.list()[0]!.center).toEqual({ x: 15, y: -4 })
    panels.push({
      title:
        direction === "z+"
          ? "z+: motor above the PCB"
          : "z-: motor below the PCB",
      code: `<assembly.device>
  <MotorController
    mountedTo="NEMA17.backface"
    mountGap="6mm"
    pcbX={10}
    pcbY={-7}
  />
  <assembly.motor
    name="NEMA17"
    model="nema17_backfaceholes"
    shaftFacingDirection="${direction}"
  />
</assembly.device>`,
      annotation: `6 mm rear-face-to-PCB clearance / 1.6 mm PCB / motor origin z=${motor.position.z} mm`,
      circuit,
      renderOptions: {
        camPos: [100, 60, 100] as [number, number, number],
        poppygl: {
          lookAt: [-10, direction === "z+" ? 34 : -34, -7] as [
            number,
            number,
            number,
          ],
        },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17 backface mounting: 6 mm surface clearance",
    panels,
  })
})
