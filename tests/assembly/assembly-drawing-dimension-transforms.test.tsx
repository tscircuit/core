import { expect, test } from "bun:test"
import { assembly } from "lib"
import { ExtrudeLinear, Rectangle, Translate } from "jscad-fiber/model"
import { renderToJscadPlan } from "jscad-fiber/headless"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("native outlines follow model scale, origins, rotation and bottom placement", async () => {
  const plan = renderToJscadPlan(
    <Translate offset={[7, -3, 4]}>
      <ExtrudeLinear height={10} topOutlineName="rim">
        <Rectangle size={[40, 20]} />
      </ExtrudeLinear>
    </Translate>,
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board width={200} height={100} routingDisabled>
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          [0, 90, 180, 270].map((rotation, column) => {
            const name = `part_${layer}_${rotation}`
            return (
              <chip
                key={name}
                name={name}
                footprint="soic8"
                layer={layer}
                pcbRotation={rotation}
                pcbX={-60 + column * 40}
                pcbY={row * 30 - 15}
                cadModel={{
                  jscad: plan,
                  modelUnitToMmScale: 2,
                  size: rotation >= 180 ? { x: 20, y: 10, z: 5 } : undefined,
                  modelOriginPosition: { x: 3, y: -4, z: 2 },
                  positionOffset: { x: 12, y: 8, z: 5 },
                  rotationOffset: { x: 0, y: 0, z: 0 },
                }}
              />
            )
          }),
        )}
      </board>
      <assembly.drawing.page size="iso_a3">
        <assembly.drawing.titleblock title="NATIVE OUTLINES FOLLOW CAD MODEL PLACEMENT" />
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          [0, 90, 180, 270].map((rotation, column) => {
            const name = `part_${layer}_${rotation}`
            return (
              <assembly.drawing.partview
                key={name}
                name={`view_${layer}_${rotation}`}
                displayName={`${layer.toUpperCase()} / Z ${rotation}°${rotation >= 180 ? " / FIT" : ""}`}
                partRef={`.${name}`}
                direction="z+"
                width={60}
                height={65}
                centerX={-140 + column * 90}
                centerY={75 - row * 120}
              >
                <assembly.drawing.dimension
                  name={`rim_${name}`}
                  edgeRef={`.${name} > .rim`}
                />
                <assembly.drawing.dimension
                  name={`extent_${name}`}
                  {...(rotation % 180 === 0
                    ? { widthOfView: true }
                    : { heightOfView: true })}
                />
              </assembly.drawing.partview>
            )
          }),
        )}
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const dimensions = circuit.db.drawing_dimension_line.list()
  for (let i = 0; i < dimensions.length; i += 2) {
    const rim = dimensions[i]!,
      extent = dimensions[i + 1]!
    expect(rim.text).toBe(Math.floor(i / 2) % 4 >= 2 ? "40 mm" : "80 mm")
    expect(rim.text).toBe(extent.text)
    // The extent comes from emitted solid mesh vertices; the rim comes from
    // native construction geometry. Their projected limits must coincide.
    for (const axis of ["x", "y"] as const) {
      if (Math.abs(extent.end[axis] - extent.start[axis]) < 1e-5) continue
      expect(rim.start[axis]).toBeCloseTo(extent.start[axis], 4)
      expect(rim.end[axis]).toBeCloseTo(extent.end[axis], 4)
    }
  }
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
