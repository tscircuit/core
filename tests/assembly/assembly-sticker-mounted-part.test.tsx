import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a sticker follows its part when the part is mounted and turned", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="STAND"
        jscad={
          <>
            <jscad.cuboid size={[40, 40, 10]} center={[0, 0, 5]} />
            <jscad.translate offset={[5, 0, 10]}>
              <jscad.rotate angles={[0, 0, Math.PI / 2]}>
                <jscad.rectangle name="top" reference size={[20, 20]} />
              </jscad.rotate>
            </jscad.translate>
          </>
        }
      />
      <assembly.printedpart
        name="CAP"
        mountedTo=".STAND > .top"
        mountFace=".base"
        jscad={
          <>
            <jscad.cuboid size={[20, 10, 4]} center={[0, 0, 2]} />
            <jscad.rotate angles={[Math.PI, 0, 0]}>
              <jscad.rectangle name="base" reference size={[2, 2]} />
            </jscad.rotate>
          </>
        }
      >
        <assembly.sticker
          name="TAG"
          surfaceRef="topSurface"
          width="8mm"
          height="3mm"
          xOffsetFromSurfaceCenter="4mm"
        />
      </assembly.printedpart>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  const [sticker] = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_sticker")
  // The cap's origin lands on the stand's datum at [5, 0, 10] and its +X turns
  // to world +Y. Its top is 4 mm above that, and the sticker sits 4 mm along
  // the cap's +X from the top's center.
  expect(sticker.center.x).toBeCloseTo(5)
  expect(sticker.center.y).toBeCloseTo(4)
  expect(sticker.center.z).toBeCloseTo(14)
  expect(sticker.normal_direction.x).toBeCloseTo(0)
  expect(sticker.normal_direction.y).toBeCloseTo(0)
  expect(sticker.normal_direction.z).toBeCloseTo(1)
  expect(sticker.x_axis_direction.x).toBeCloseTo(0)
  expect(sticker.x_axis_direction.y).toBeCloseTo(1)
  expect(sticker.x_axis_direction.z).toBeCloseTo(0)
})
