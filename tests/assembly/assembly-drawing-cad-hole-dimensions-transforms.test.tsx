import { expect, test } from "bun:test"
import { assembly } from "lib"
import { renderToJscadPlan } from "jscad-fiber/headless"
import { HolePlate } from "tests/fixtures/assembly-drawing/hole-plate"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CAD hole spacing follows model units, fitted size, rotation and layer", async () => {
  const plan = renderToJscadPlan(<HolePlate />)
  for (const layer of ["top", "bottom"] as const)
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          <board width={200} height={200} routingDisabled>
            <chip
              name="J1"
              footprint="soic8"
              pcbX={23}
              pcbY={-17}
              pcbRotation={rotation}
              layer={layer}
              cadModel={{
                jscad: plan,
                modelUnitToMmScale: 2,
                size: rotation >= 180 ? { x: 25, y: 15, z: 2 } : undefined,
                modelOriginPosition: { x: 3, y: -4, z: 1 },
                positionOffset: { x: 7, y: 2, z: 5 },
              }}
            />
          </board>
          <assembly.drawing.page size="iso_a4">
            <assembly.drawing.partview
              partRef=".J1"
              direction="z+"
              width={100}
              height={100}
            >
              <assembly.drawing.dimension
                fromRef=".J1 > .H1"
                toRef=".J1 > .H2"
                axis="x"
              />
              <assembly.drawing.dimension
                fromRef=".J1 > .H1"
                toRef=".J1 > .H2"
                axis="y"
              />
            </assembly.drawing.partview>
          </assembly.drawing.page>
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const spacing = rotation >= 180 ? [30, 14] : [60, 28]
      if (rotation % 180) spacing.reverse()
      expect(
        circuit.db.drawing_dimension_line.list().map(({ text }) => text),
      ).toEqual(spacing.map((value) => `${value} mm`))
    }
})
