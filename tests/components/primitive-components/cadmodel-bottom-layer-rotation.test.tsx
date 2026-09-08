import { expect, test } from "bun:test"
import { normalizeDegrees } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("child cadmodel and object cadModel emit the same top and bottom rotations", () => {
  for (const layer of ["bottom", "top"] as const) {
    for (const [pcbRotation, offsetZ, topZ, bottomZ] of [
      [0, 0, 0, 0],
      [90, 0, 90, 270],
      [180, 0, 180, 180],
      [270, 0, 270, 90],
      [90, 30, 120, 240],
      [0, -45, 315, 45],
      [270, 450, 0, 0],
    ]) {
      const { circuit } = getTestFixture()
      const modelUrl = "https://example.com/model.step"
      const rotationOffset = { x: 0, y: 0, z: offsetZ }
      circuit.add(
        <board width={20} height={20} routingDisabled>
          <resistor
            name="R_CHILD"
            resistance={1000}
            footprint="0402"
            pcbX={0}
            pcbY={0}
            layer={layer}
            pcbRotation={pcbRotation}
            cadModel={
              <cadmodel modelUrl={modelUrl} rotationOffset={rotationOffset} />
            }
          />
          <resistor
            name="R_OBJECT"
            resistance={1000}
            footprint="0402"
            pcbX={0}
            pcbY={0}
            layer={layer}
            pcbRotation={pcbRotation}
            cadModel={{ stepUrl: modelUrl, rotationOffset }}
          />
        </board>,
      )
      circuit.render()

      const cadComponents = circuit.db.cad_component.list()
      expect(cadComponents).toHaveLength(2)
      for (const cad of cadComponents) {
        const rotation = cad.rotation
        if (!rotation) throw new Error("CAD model did not emit a rotation")
        expect(rotation.x).toBeCloseTo(0, 5)
        expect(rotation.y).toBeCloseTo(layer === "bottom" ? 180 : 0, 5)
        // Compare orientations, not whether equivalent angles use 0..360.
        expect(normalizeDegrees(rotation.z)).toBeCloseTo(
          layer === "bottom" ? bottomZ : topZ,
          5,
        )
      }
    }
  }
})
