import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

// Signed local-axis indices for each expected world axis (1=X, 2=Y, 3=Z).
// These authored poses exercise roll as well as all six shaft directions.
const poses = [
  {
    label: "front / shaft -Z",
    angles: [0, 0, 0],
    face: "frontface",
    axes: [1, -2, -3],
  },
  {
    label: "front / shaft +Z",
    angles: [Math.PI, 0, 0],
    face: "frontface",
    axes: [1, 2, 3],
  },
  {
    label: "front / shaft -X",
    angles: [0, Math.PI / 2, 0],
    face: "frontface",
    axes: [-3, -2, -1],
  },
  {
    label: "front / shaft +X",
    angles: [0, -Math.PI / 2, 0],
    face: "frontface",
    axes: [3, -2, 1],
  },
  {
    label: "front / shaft +Y",
    angles: [Math.PI / 2, 0, 0],
    face: "frontface",
    axes: [1, 3, -2],
  },
  {
    label: "front / shaft -Y",
    angles: [-Math.PI / 2, 0, 0],
    face: "frontface",
    axes: [1, -3, 2],
  },
  {
    label: "back / 90 degree roll",
    angles: [0, 0, Math.PI / 2],
    face: "backface",
    axes: [-2, 1, 3],
  },
  {
    label: "back / 270 degree roll",
    angles: [0, Math.PI, Math.PI / 2],
    face: "backface",
    axes: [-2, -1, -3],
  },
] as const

test("motors mate front and back faces with translated, rotated frame references", async () => {
  const native = getTestFixture().circuit
  native.add(
    <assembly.device>
      <assembly.motor name="M" standard="nema17" />
    </assembly.device>,
  )
  await native.renderUntilSettled()
  const nativeBounds = await getRenderedMotorBounds(
    await withLocalNemaMesh(native.getCircuitJson()),
  )
  const localMin = [
    -nativeBounds.max[0],
    nativeBounds.min[2],
    nativeBounds.min[1],
  ]
  const localMax = [
    -nativeBounds.min[0],
    nativeBounds.max[2],
    nativeBounds.max[1],
  ]
  const panels = []
  for (const pose of poses) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="PRINTER">
        <assembly.motor
          name="M"
          standard="nema17"
          mountedTo="PRINTER.FRAME.motor"
          mountFace={pose.face}
          mountGap="0.2cm"
        />
        <assembly.printedpart
          name="FRAME"
          jscad={
            <jscad.translate offset={[12, -7, 30]}>
              <jscad.rotate angles={[...pose.angles]}>
                <jscad.subtract>
                  <jscad.cuboid size={[50, 50, 4]} center={[0, 0, -2]} />
                  <jscad.cylinder radius={12} height={6} />
                </jscad.subtract>
                <jscad.rectangle name="motor" size={[50, 50]} reference />
              </jscad.rotate>
            </jscad.translate>
          }
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const json = await withLocalNemaMesh(circuit.getCircuitJson())
    const motor = circuit.db.cad_component
      .list()
      .find((cad) => cad.model_glb_url)!
    const motorJson = json.filter(
      (el) =>
        el.type === "cad_component" &&
        el.cad_component_id === motor.cad_component_id,
    )
    const bounds = await getRenderedMotorBounds(motorJson)
    const worldMin = [-bounds.max[0], bounds.min[2], bounds.min[1]]
    const worldMax = [-bounds.min[0], bounds.max[2], bounds.max[1]]
    const origin = [12, -7, 30]
    for (let worldAxis = 0; worldAxis < 3; worldAxis++) {
      const mapped = pose.axes[worldAxis]!
      const localAxis = Math.abs(mapped) - 1
      const sign = Math.sign(mapped)
      const targetNormal =
        localAxis === 2 ? sign * (pose.face === "frontface" ? -1 : 1) : 0
      const position =
        origin[worldAxis]! + targetNormal * (pose.face === "backface" ? 40 : 2)
      expect(
        [motor.position.x, motor.position.y, motor.position.z][worldAxis]!,
      ).toBeCloseTo(position, 4)
      expect(worldMin[worldAxis]!).toBeCloseTo(
        position +
          sign * (sign > 0 ? localMin[localAxis]! : localMax[localAxis]!),
        3,
      )
      expect(worldMax[worldAxis]!).toBeCloseTo(
        position +
          sign * (sign > 0 ? localMax[localAxis]! : localMin[localAxis]!),
        3,
      )
    }
    panels.push({
      title: pose.label,
      code: `<jscad.translate offset={[12,-7,30]}>
  <jscad.rotate angles={[${pose.angles.map((a) => Number(a.toFixed(3))).join(", ")}]}>
    <jscad.rectangle name="motor"
      reference size={[50,50]} />
  </jscad.rotate>
</jscad.translate>

<assembly.motor name="M" standard="nema17"
  mountedTo="PRINTER.FRAME.motor"
  mountFace="${pose.face}" mountGap="2mm" />`,
      annotation:
        "2 mm face clearance / reference center (12, -7, 30) mm / motor declared before frame",
      circuit: json,
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17 named-face mounting: six shaft directions and roll",
    panels,
    columns: 2,
  })
}, 60000)
