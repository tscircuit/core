import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion, jscad } from "lib"
import type { CadComponent, CadReferenceSurface } from "circuit-json"
import { vec3 } from "gl-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { poppyglExplosionLines } from "./fixtures/poppygl-explosion-lines"

test("explosion directions follow emitted mounting frames including tilted and inverted faces", async () => {
  const panels = []
  for (const normalDirection of ["z+", "z-", "y+", "y-"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="FRAME">
        <assembly.part
          name="BASE"
          cadModel={{ jscad: { type: "cuboid", size: [16, 16, 4] } }}
        >
          <assembly.referencesurface
            name="face"
            plane={normalDirection[0] === "z" ? "xy" : "xz"}
            normalDirection={normalDirection}
          />
        </assembly.part>
        <assembly.printedpart
          name="CARRIER"
          mountedTo="BASE.face"
          mountFace="back"
          jscad={<jscad.cuboid size={[8, 8, 4]} center={[0, 0, 2]} />}
          color="#d9a15f"
        >
          <assembly.referencesurface name="back" normalDirection="z-" />
          <assembly.referencesurface name="axes" />
          <assembly.subassembly name="MODULE">
            <assembly.part
              name="MARKER"
              cadModel={{
                jscad: { type: "sphere", radius: 2, center: [0, 0, 7] },
              }}
            />
            <assembly.explosion.stage name="move-marker">
              <assembly.explosion.move
                targetRef="MARKER"
                offX="5mm"
                offY="7mm"
                offZ="11mm"
              />
            </assembly.explosion.stage>
          </assembly.subassembly>
        </assembly.printedpart>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const assembled = circuit.getCircuitJson()
    const exploded = getAssemblyExplosion(circuit)
    const carrier = circuit.db.source_component
      .list()
      .find((part) => part.name === "CARRIER")!
    const marker = circuit.db.source_component
      .list()
      .find((part) => part.name === "MARKER")!
    const frame = assembled.find(
      (record): record is CadReferenceSurface =>
        record.type === "cad_reference_surface" &&
        record.source_component_id === carrier.source_component_id &&
        record.name === "axes",
    )!
    const findMarker = (json: typeof assembled) =>
      json.find(
        (record): record is CadComponent =>
          record.type === "cad_component" &&
          record.source_component_id === marker.source_component_id,
      )!
    const from = findMarker(assembled).position
    const to = findMarker(exploded.circuitJson).position
    const x = [frame.x_axis.x, frame.x_axis.y, frame.x_axis.z] as const
    const z = [frame.normal.x, frame.normal.y, frame.normal.z] as const
    const y = vec3.cross(vec3.create(), z, x)
    for (const [axis, coordinate] of ["x", "y", "z"].entries()) {
      expect(
        to[coordinate as "x" | "y" | "z"] - from[coordinate as "x" | "y" | "z"],
      ).toBeCloseTo(5 * x[axis] + 7 * y[axis] + 11 * z[axis], 4)
    }
    panels.push({
      title: `Mounted face normal: ${normalDirection}`,
      circuit: exploded.circuitJson,
      code: `<assembly.printedpart name="CARRIER"\n  mountedTo="BASE.face" mountFace="back">\n  <assembly.subassembly name="MODULE">\n    <assembly.explosion.stage name="move-marker">\n      <assembly.explosion.move targetRef="MARKER"\n        offX="5mm" offY="7mm" offZ="11mm" />\n    </assembly.explosion.stage>\n  </assembly.subassembly>\n</assembly.printedpart>`,
      annotation:
        "Offsets follow the emitted mounting-frame axes; all axes move together.",
      renderOptions: {
        camPos: [45, 35, 45] as [number, number, number],
        poppygl: {
          lookAt: [0, 5, 0] as [number, number, number],
          explosionLines: poppyglExplosionLines(exploded),
        },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Explosion moves use resolved constraint frames, not world-axis guesses",
    panels,
    columns: 2,
  })
})
