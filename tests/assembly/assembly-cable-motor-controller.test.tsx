import { expect, test } from "bun:test"
import { cad_cable } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { CabledMotorController } from "./fixtures/cabled-motor-controller"

test("a cabled motor and controller mount inside one printed frame", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<CabledMotorController />)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(6)
  const cable = circuit
    .getCircuitJson()
    .find((element) => element.type === "cad_cable")!
  expect(cad_cable.parse(cable).cableprinter_string).toBe("jst_ph_pins6")
  const motor = circuit.db.source_component
    .list()
    .find((source) => source.name === "MOTOR")!
  const connector = circuit.db.source_component
    .list()
    .find((source) => source.name === "J_MOTOR")!
  expect(cable.from_source_component_id).toBe(motor.source_component_id)
  expect(cable.to_source_component_id).toBe(connector.source_component_id)
  const motorCad = circuit.db.cad_component
    .list()
    .find((cad) => cad.source_component_id === motor.source_component_id)!
  expect(cable.path[0]!.x).toBeCloseTo(
    motorCad.position.x + 21.15 + 6 + 6.85,
    4,
  )
  const connectorCad = circuit.db.cad_component
    .list()
    .find((cad) => cad.source_component_id === connector.source_component_id)!
  const last = cable.path.at(-1)!
  expect(last.x).toBeCloseTo(connectorCad.position.x, 4)
  expect(last.y).toBeCloseTo(connectorCad.position.y, 4)
  expect(last.z).toBeCloseTo(connectorCad.position.z + 6 + 6.85, 4)
  expect(cable.path[1]!.x - cable.path[0]!.x).toBeCloseTo(0.1, 4)
  expect(cable.path.at(-2)!.z - last.z).toBeCloseTo(0.1, 4)
  const renderedJson = await withLocalNemaMesh(circuit.getCircuitJson())
  const frame = circuit.db.source_component
    .list()
    .find((source) => source.name === "FRAME")!
  await expectAssemblySnapshot(import.meta.path, {
    title: "Motor enclosure + controller + inferred six-wire PH cable",
    font: "alphabet",
    panels: [
      {
        title: "Face mounts position the parts; endpoints define the cable",
        code: `<assembly.device>
  <assembly.printedpart name="FRAME"
    jscad={<MotorControllerFrame />}>
    <assembly.motor name="MOTOR"
      standard="nema17"
      wireConnection="jst-ph-6"
      mountedTo="FRAME.motor"
      mountFace="frontface" />
  </assembly.printedpart>
  <board name="CONTROLLER"
    mountedTo="FRAME.controller">
    <connector name="J_MOTOR"
      standard="jst_ph" pinCount={6}
      footprint="jst6_ph"
      pcbX={-18} pcbRotation={90} />
  </board>
  <assembly.cable name="MOTOR_CABLE"
    from="MOTOR.wireside"
    to=".CONTROLLER > .J_MOTOR" />
</assembly.device>`,
        annotation:
          "Named reference planes / 31 mm NEMA17 holes / cable window / four board supports",
        circuit: renderedJson,
        renderOptions: {
          poppygl: { camPos: [-120, 150, 165], lookAt: [20, 15, 0], fov: 40 },
        },
      },
      {
        title: "Cutaway: inspect the actual motor and connector alignment",
        code: `<jscad.translate offset={[-65, 0, 45]}>
  <jscad.rotate angles={[Math.PI, 0, 0]}>
    <jscad.rectangle name="motor"
      reference size={[42, 42]} />
  </jscad.rotate>
</jscad.translate>

<jscad.translate offset={[38, 0, 8]}>
  <jscad.rectangle name="controller"
    reference size={[48, 34]} />
</jscad.translate>

// Subtract this cable window:
<jscad.cuboid size={[10, 20, 12]}
  center={[-40, 0, 10]} />`,
        annotation:
          "Frame mesh hidden only in this inspection view; motor, board and cable keep their placements.",
        circuit: renderedJson.filter(
          (element) =>
            element.type !== "cad_component" ||
            element.source_component_id !== frame.source_component_id,
        ),
        renderOptions: {
          poppygl: { camPos: [-120, 150, 165], lookAt: [20, 15, 0], fov: 40 },
        },
      },
    ],
  })
})
