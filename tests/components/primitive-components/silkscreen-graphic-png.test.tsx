import { expect, test } from "bun:test"
import { encode } from "fast-png"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PNG silkscreen respects alpha, white pixels, rotation and layer", async () => {
  const pngBytes = encode({
    width: 2,
    height: 2,
    channels: 4,
    data: new Uint8Array([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 100,
    ]),
  })
  const imageUrl = `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12}>
      <silkscreengraphic
        imageUrl={imageUrl}
        width={4}
        height={2}
        pcbX={3}
        pcbY={1}
        pcbRotation={90}
        layer="bottom"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const graphics = circuit.db.pcb_silkscreen_graphic.list()
  expect(graphics).toHaveLength(1)
  expect(graphics[0]!.layer).toBe("bottom")
  expect(graphics[0]!.brep_shape.outer_ring.vertices).toEqual(
    expect.arrayContaining([
      { x: expect.closeTo(2), y: expect.closeTo(-1) },
      { x: expect.closeTo(2), y: expect.closeTo(1) },
      { x: expect.closeTo(3), y: expect.closeTo(1) },
      { x: expect.closeTo(3), y: expect.closeTo(-1) },
    ]),
  )
})
