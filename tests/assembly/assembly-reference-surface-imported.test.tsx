import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { mat4, vec3 } from "gl-matrix"

test("imported printed parts compose their model offsets inside a tilted child surface frame", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="BASE">
        <assembly.referencesurface name="side" plane="xz" centerYOffset="4mm" />
      </assembly.part>
      <assembly.printedpart
        name="ASSET"
        mountedTo="BASE.side"
        mountFace="bottom"
        cadModel={{
          stlUrl: "https://example.com/probe.stl",
          positionOffset: { x: 1, y: 2, z: 3 },
          rotationOffset: { x: 0, y: 0, z: 90 },
        }}
      >
        <assembly.referencesurface name="bottom" normalDirection="z-" />
      </assembly.printedpart>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cad = circuit.db.cad_component.list()[0]
  expect(cad.position.x).toBeCloseTo(1)
  expect(cad.position.y).toBeCloseTo(7)
  expect(cad.position.z).toBeCloseTo(-2)
  const surfaces = circuit.db.cad_reference_surface.list()
  expect(surfaces).toHaveLength(2) // Includes the geometry-free BASE.
  const assetFrame = surfaces.find((s) => s.name === "bottom")!
  // Model offsets move the asset, never its mating frame.
  expect(assetFrame.center).toEqual({ x: 0, y: 4, z: 0 })
  expect(assetFrame.normal.y).toBeCloseTo(-1)
  expect(assetFrame.x_axis).toEqual({ x: 1, y: 0, z: 0 })
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_reference_surface.list()).toHaveLength(2)
  const frame = mat4.create()
  const rotation = cad.rotation!
  mat4.rotateZ(frame, frame, (rotation.z * Math.PI) / 180)
  mat4.rotateY(frame, frame, (rotation.y * Math.PI) / 180)
  mat4.rotateX(frame, frame, (rotation.x * Math.PI) / 180)
  const point = vec3.transformMat4(vec3.create(), [1, 2, 3], frame)
  for (const [axis, expected] of [-2, 3, -1].entries())
    expect(point[axis]).toBeCloseTo(expected)
})
