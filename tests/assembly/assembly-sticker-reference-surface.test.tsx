import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a sticker can sit on a part's named reference surface, measured from its edges", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="PANEL"
        cadModel={{ jscad: { type: "cuboid", size: [30, 2, 20] } }}
      >
        <assembly.referencesurface
          name="face"
          plane="xz"
          normalDirection="y-"
          centerYOffset="-1mm"
          width="30mm"
          height="20mm"
        />
        <assembly.sticker
          name="SERIAL"
          surfaceRef="face"
          width="10mm"
          height="4mm"
          distanceFromSurfaceRightEdge="2mm"
          distanceFromSurfaceTopEdge="3mm"
        />
      </assembly.part>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  const [sticker] = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_sticker")
  // The face is 30 mm wide along +X and 20 mm tall along +Z at Y=-1. The
  // sticker's right edge is 2 mm inside X=15 and its top edge 3 mm below Z=10.
  expect(sticker).toMatchObject({
    center: { x: 8, y: -1, z: 5 },
    normal_direction: { x: 0, y: -1, z: 0 },
    x_axis_direction: { x: 1, y: 0, z: 0 },
  })
})
