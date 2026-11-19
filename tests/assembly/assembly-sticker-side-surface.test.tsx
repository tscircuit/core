import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a sticker on a side surface is placed from that surface's edges and turned on it", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="BOX"
        jscad={<jscad.cuboid size={[40, 30, 10]} center={[0, 0, 5]} />}
      >
        <assembly.sticker
          name="SERIAL"
          surfaceRef="frontSurface"
          width="6mm"
          height="4mm"
          rotationOnSurface="90deg ccw"
          distanceFromSurfaceLeftEdge="2mm"
          distanceFromSurfaceBottomEdge="1mm"
        />
      </assembly.printedpart>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  const [sticker] = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_sticker")
  // The front surface is the Y=-15 face: 40 mm wide along +X and 10 mm tall
  // along +Z, seen from outside. Turned a quarter turn, the 6 × 4 mm sticker
  // covers 4 × 6 mm, so its center is 2 + 2 mm from the left edge (X=-20) and
  // 1 + 3 mm above the bottom edge (Z=0).
  expect(sticker.center.x).toBeCloseTo(-16)
  expect(sticker.center.y).toBeCloseTo(-15)
  expect(sticker.center.z).toBeCloseTo(4)
  expect(sticker.normal_direction.x).toBeCloseTo(0)
  expect(sticker.normal_direction.y).toBeCloseTo(-1)
  expect(sticker.normal_direction.z).toBeCloseTo(0)
  // Its artwork now reads bottom to top.
  expect(sticker.x_axis_direction.x).toBeCloseTo(0)
  expect(sticker.x_axis_direction.y).toBeCloseTo(0)
  expect(sticker.x_axis_direction.z).toBeCloseTo(1)
  expect(sticker).toMatchObject({ width: 6, height: 4 })
  expect(sticker).not.toHaveProperty("image_asset")
})
