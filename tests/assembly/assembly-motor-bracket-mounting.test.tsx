import { expect, test } from "bun:test"
import { Fragment } from "react"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

const controllerHoles = [-32, 32].flatMap((x) => [-12, 12].map((y) => [x, y]))

function MotorBracket() {
  return (
    <>
      <jscad.subtract>
        <jscad.union>
          <jscad.cuboid size={[100, 105, 5]} center={[-10, 20, 2.5]} />
          <jscad.cuboid size={[4, 50, 54]} center={[2, 0, 32]} />
          {[-24, 24].map((y) => (
            <jscad.cuboid key={y} size={[28, 5, 20]} center={[-10, y, 15]} />
          ))}
          {controllerHoles.map(([x, y]) => (
            <jscad.cylinder
              key={`${x},${y}`}
              radius={4}
              height={14}
              center={[x! - 10, y! + 50, 7]}
            />
          ))}
        </jscad.union>
        {/* NEMA17: 22 mm pilot and 31 mm screw-hole spacing. */}
        <jscad.translate offset={[2, 0, 32]}>
          <jscad.rotate angles={[0, Math.PI / 2, 0]}>
            <jscad.cylinder radius={11.5} height={6} />
            {[-15.5, 15.5].flatMap((x) =>
              [-15.5, 15.5].map((y) => (
                <jscad.cylinder
                  key={`${x},${y}`}
                  radius={1.6}
                  height={6}
                  center={[x, y, 0]}
                />
              )),
            )}
          </jscad.rotate>
        </jscad.translate>
        {controllerHoles.map(([x, y]) => (
          <jscad.cylinder
            key={`${x},${y}`}
            radius={1.6}
            height={16}
            center={[x! - 10, y! + 50, 7]}
          />
        ))}
        {[-50, 30].flatMap((x) =>
          [-24, 66].map((y) => (
            <jscad.cylinder
              key={`${x},${y}`}
              radius={2.2}
              height={7}
              center={[x, y, 2.5]}
            />
          )),
        )}
      </jscad.subtract>
      <jscad.translate offset={[0, 0, 32]}>
        <jscad.rotate angles={[0, -Math.PI / 2, 0]}>
          <jscad.rectangle name="motor" size={[42, 42]} reference />
        </jscad.rotate>
      </jscad.translate>
      <jscad.translate offset={[-10, 50, 14]}>
        <jscad.rectangle name="controller" size={[76, 34]} reference />
      </jscad.translate>
    </>
  )
}

test("a NEMA17 mounts to a printed bracket beside its controller", async () => {
  const panels = []
  for (const withController of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.printedpart name="BRACKET" jscad={<MotorBracket />} />
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          mountedTo="BRACKET.motor"
          mountFace="frontface"
        />
        {withController && (
          <board
            name="CONTROL"
            width={76}
            height={34}
            thickness={1.6}
            pcbX={-10}
            pcbY={50}
            mountedTo="BRACKET.controller"
            routingDisabled
          >
            {controllerHoles.map(([x, y]) => (
              <Fragment key={`${x},${y}`}>
                <hole diameter={3.2} pcbX={x} pcbY={y} />
              </Fragment>
            ))}
            <pinheader
              name="J_MOTOR"
              pinCount={4}
              pitch={2.54}
              pcbX={-23}
              pcbY={0}
              pinLabels={["A1", "A2", "B1", "B2"]}
            />
            <pinheader
              name="J_POWER"
              pinCount={2}
              pitch={2.54}
              pcbX={24}
              pcbY={0}
            />
            <chip name="U_DRIVER" footprint="soic16" pcbX={0} pcbY={0} />
            <silkscreentext
              text="MOTOR CONTROL"
              fontSize={1.8}
              pcbX={0}
              pcbY={-11}
            />
            <silkscreentext text="MOTOR" fontSize={1.5} pcbX={-23} pcbY={6} />
            <silkscreentext text="POWER" fontSize={1.5} pcbX={24} pcbY={6} />
          </board>
        )}
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const json = await withLocalNemaMesh(circuit.getCircuitJson())
    const motor = circuit.db.cad_component
      .list()
      .find((c) => c.model_glb_url?.includes("nema17"))!
    const zOffset = withController ? -14.8 : 0
    expect(motor.position.x).toBeCloseTo(0, 4)
    expect(motor.position.y).toBeCloseTo(0, 4)
    expect(motor.position.z).toBeCloseTo(32 + zOffset, 4)
    const bounds = await getRenderedMotorBounds(
      json.filter(
        (el) =>
          el.type === "cad_component" &&
          el.cad_component_id === motor.cad_component_id,
      ),
    )
    // Emitted shaft points along world +X (renderer -X), through the bracket.
    expect(-bounds.min[0]!).toBeCloseTo(24, 3)
    expect(-bounds.max[0]!).toBeCloseTo(-41, 3)
    if (withController) {
      const board = circuit.db.pcb_board.list()[0]!
      expect(board.center).toEqual({ x: -10, y: 50 })
      const bracket = circuit.db.cad_component
        .list()
        .find((c) => c.model_jscad)!
      expect(bracket.position.z + 14).toBeCloseTo(-board.thickness / 2, 4)
      expect(circuit.db.pcb_hole.list().map((h) => [h.x, h.y])).toEqual(
        controllerHoles.map(([x, y]) => [x! - 10, y! + 50]),
      )
    }
    panels.push({
      title: withController
        ? "Add a controller on the base's four standoffs"
        : "Mount the motor to a printed L bracket",
      code: `<assembly.device>
  <assembly.printedpart name="BRACKET"
    jscad={<MotorBracket />} />
  <assembly.motor name="MOTOR"
    standard="nema17"
    mountedTo="BRACKET.motor"
    mountFace="frontface" />${withController ? '\n  <board mountedTo="BRACKET.controller"\n    pcbX={-10} pcbY={50}\n    width={76} height={34}>\n    {/* Driver, connectors, mounting holes */}\n  </board>' : ""}
</assembly.device>`,
      annotation: withController
        ? "The board rests on 14 mm posts; motor and board share the printed base."
        : "31 mm screw spacing / 23 mm pilot clearance / shaft passes through the upright.",
      circuit: json,
      renderOptions: {
        camPos: [-130, 115 + zOffset, 145] as [number, number, number],
        poppygl: { lookAt: [10, 24 + zOffset, 20] as [number, number, number] },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17 on a printed motor bracket and controller base",
    panels,
  })
}, 60000)
