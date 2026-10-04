import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { MotorSpacer } from "./fixtures/motor-spacer"

test("a PCB anchors frame -> motor -> spacer chains without moving PCB geometry", async () => {
  const panels = []
  for (const [mountFace, pcbRotation] of [
    ["frontface", 0],
    ["frontface", 90],
    ["backface", 180],
    ["backface", 270],
  ] as const) {
    const { circuit } = getTestFixture()
    const boardFace = mountFace === "frontface" ? "backface" : "frontface"
    circuit.add(
      <assembly.device>
        <board
          name="CONTROL"
          width={42}
          height={42}
          thickness={1.6}
          pcbX={12}
          pcbY={-7}
          pcbRotation={pcbRotation}
          mountedTo="SPACER.board"
          mountGap={2}
          routingDisabled
        >
          <hole diameter={3.2} pcbX={15.5} pcbY={-15.5} />
          <hole diameter={30} />
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={18} />
        </board>
        <assembly.printedpart
          name="SPACER"
          jscad={<MotorSpacer />}
          mountedTo={`MOTOR.${boardFace}`}
          mountFace="motor"
          mountGap={5}
        />
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          mountedTo="FRAME.motor"
          mountFace={mountFace}
          mountGap={4}
        />
        <assembly.printedpart
          name="FRAME"
          jscad={
            <jscad.translate offset={[20, -10, 50]}>
              <jscad.subtract>
                <jscad.cuboid size={[50, 50, 4]} center={[0, 0, -2]} />
                <jscad.cylinder radius={12} height={6} />
              </jscad.subtract>
              <jscad.rectangle name="motor" size={[50, 50]} reference />
            </jscad.translate>
          }
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_board.list()[0]!.center).toEqual({ x: 12, y: -7 })
    const hole = circuit.db.pcb_hole.list()[0]!
    const expectedHoles = {
      0: [27.5, -22.5],
      90: [27.5, 8.5],
      180: [-3.5, 8.5],
      270: [-3.5, -22.5],
    } as const
    expect(hole.x).toBeCloseTo(expectedHoles[pcbRotation][0], 4)
    expect(hole.y).toBeCloseTo(expectedHoles[pcbRotation][1], 4)
    const json = await withLocalNemaMesh(circuit.getCircuitJson())
    const cadFor = (name: string) => {
      const source = circuit.db.source_component
        .list()
        .find((s) => s.name === name)!
      return json.filter(
        (el) =>
          el.type === "cad_component" &&
          el.source_component_id === source.source_component_id,
      )
    }
    const spacerBounds = await getRenderedMotorBounds(cadFor("SPACER"))
    expect(spacerBounds.max[1]).toBeCloseTo(-2.8, 3)
    expect(spacerBounds.min[1]).toBeCloseTo(-12.8, 3)
    const motor = circuit.db.cad_component.list().find((c) => c.model_glb_url)!
    // Spacer's motor plane is Z=-12.8; motor mating plane is 5 mm below it.
    expect(motor.position.z).toBeCloseTo(
      mountFace === "frontface" ? -55.8 : -17.8,
      3,
    )
    expect(motor.subcircuit_id).toBe(
      circuit.db.pcb_board.list()[0]!.subcircuit_id,
    )
    panels.push({
      title: `${mountFace} to frame / PCB ${pcbRotation} degrees`,
      code: `<assembly.motor name="MOTOR"
  standard="nema17"
  mountedTo="FRAME.motor"
  mountFace="${mountFace}" mountGap={4} />
<assembly.printedpart name="SPACER"
  mountedTo="MOTOR.${boardFace}"
  mountFace="motor" mountGap={5}
  jscad={<MotorSpacer />} />
<board mountedTo="SPACER.board"
  mountGap={2} pcbX={12} pcbY={-7}
  pcbRotation={${pcbRotation}} ... >
  <hole diameter={30} />
</board>`,
      annotation:
        "PCB remains at Z=0 / 2 mm spacer-to-PCB gap / forward-reference mounting chain",
      circuit: json,
      renderOptions: {
        camPos: [110, 60, 120] as [number, number, number],
        poppygl: { lookAt: [-12, -25, -7] as [number, number, number] },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Controller anchored to a frame-mounted motor",
    panels,
    columns: 2,
  })
}, 60000)
