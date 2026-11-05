import { expect, test } from "bun:test"
import { loadCadComponentMesh } from "circuit-json-to-gltf"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("cable pin 1 engages the actual motor post in all six shaft orientations", async () => {
  const panels = []
  for (const direction of ["x+", "x-", "y+", "y-", "z+", "z-"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          wireConnection="jst6_ph"
          shaftFacingDirection={direction}
        />
        <board width={32} height={24} thickness={1.6} pcbX={75} routingDisabled>
          <connector
            name="J"
            standard="jst_ph"
            pinCount={6}
            footprint="jst6_ph"
            layer={direction === "x+" ? "bottom" : "top"}
          />
          <hole pcbX={-12} pcbY={8} diameter={3.2} />
          <hole pcbX={12} pcbY={-8} diameter={3.2} />
        </board>
        <assembly.cable name="HARNESS" from="MOTOR.wireside" to=".J" />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const json = await withLocalNemaMesh(circuit.getCircuitJson())
    const source = circuit.db.source_component
      .list()
      .find((source) => source.name === "MOTOR")!
    const cad = json.find(
      (element) =>
        element.type === "cad_component" &&
        element.source_component_id === source.source_component_id,
    )!
    if (cad.type !== "cad_component") throw new Error("Missing motor model")
    const mesh = await loadCadComponentMesh(cad)
    const cable = circuit.db.cad_cable.list()[0]!
    const pin1 = cable.from_connector_pin1_position!
    const a = cable.path[0]!,
      b = cable.path[1]!
    const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
    const outward = [
      (b.x - a.x) / length,
      (b.y - a.y) / length,
      (b.z - a.z) / length,
    ]
    // Actual pinned model: socket post tips are 3.4 mm from the motor wall.
    // The seated plug tip is 2.6 mm from it. Find all four corners of pin 1's
    // square post at the expected contact overlap, in circuit-world mm +Z up.
    // A wrong motor orientation or seating plane misses the contact post.
    const postCorners = Array.from(
      { length: mesh.positions.length / 3 },
      (_, i) => mesh.positions.slice(i * 3, i * 3 + 3),
    ).filter((point) => {
      const offset = [
        point[0]! - pin1.x,
        point[1]! - pin1.y,
        point[2]! - pin1.z,
      ]
      const axial = offset.reduce(
        (sum, value, axis) => sum + value * outward[axis]!,
        0,
      )
      const transverse = Math.hypot(
        ...offset.map((value, axis) => value - axial * outward[axis]!),
      )
      return (
        Math.abs(axial - 0.8) < 1e-4 &&
        Math.abs(transverse - Math.SQRT2 * 0.25) < 1e-4
      )
    })
    expect(postCorners.length).toBeGreaterThanOrEqual(4)
    panels.push({
      title: `NEMA17 / shaft ${direction}`,
      code: `<assembly.motor name="MOTOR"\n  standard="nema17"\n  wireConnection="jst6_ph"\n  shaftFacingDirection="${direction}" />\n<connector name="J"\n  standard="jst_ph" pinCount={6}\n  layer="${direction === "x+" ? "bottom" : "top"}"\n  footprint="jst6_ph" />\n<assembly.cable name="HARNESS"\n  from="MOTOR.wireside" to=".J" />`,
      annotation:
        "Plug nose enters the real socket; pin 1 engages the motor post. The board uses the same seated profile.",
      circuit: json,
      renderOptions: {
        poppygl: {
          camPos: [-95, direction === "x+" ? -100 : 100, 145] as [
            number,
            number,
            number,
          ],
          lookAt: [-30, 0, 0] as [number, number, number],
          fov: 38,
        },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Motor cable seating / six shaft orientations",
    font: "alphabet",
    layout: "model_focus",
    panels,
    columns: 2,
  })
}, 30_000)
