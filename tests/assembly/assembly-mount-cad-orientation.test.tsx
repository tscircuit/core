import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

import {
  mechanicalPlan,
  AngleBracket,
  SlottedPlate,
} from "./fixtures/mechanical-assembly-models"

test("tilted mounts keep CAD offsets and exported anisotropic geometry aligned with datums", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="BASE"
        cadModel={{
          jscad: mechanicalPlan(
            <jscad.translate offset={[10, 20, 30]}>
              <jscad.rotate angles={[Math.PI / 2, 0, Math.PI / 2]}>
                <SlottedPlate color="#2879b7" />
              </jscad.rotate>
            </jscad.translate>,
          ),
        }}
      >
        <assembly.referencesurface
          name="face"
          plane="yz"
          centerXOffset={10}
          centerYOffset={20}
          centerZOffset={30}
        />
      </assembly.part>
      <assembly.part
        name="PART"
        mountedTo=".BASE > .face"
        mountFace="base"
        mountOffset={{ x: 2, y: 3 }}
        mountGap={4}
        cadModel={{
          jscad: mechanicalPlan(
            <jscad.translate offset={[-2, -3, -4]}>
              <AngleBracket />
            </jscad.translate>,
          ),
          positionOffset: { x: 2, y: 3, z: 4 },
        }}
      >
        <assembly.referencesurface name="base" normalDirection="z-" />
      </assembly.part>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component
    .list()
    .find((p) => p.name === "PART")!
  const cad = circuit.db.cad_component
    .list()
    .find((p) => p.source_component_id === source.source_component_id)!
  expect(cad.position).toEqual({ x: 18, y: 24, z: 36 })
  const bounds = await getRenderedMotorBounds(
    circuit
      .getCircuitJson()
      .filter(
        (element) =>
          element.type !== "cad_component" ||
          element.source_component_id === source.source_component_id,
      ),
  )
  // Native GLB uses (-X, +Z, +Y). The YZ target maps local XYZ -> world YZX.
  // Vendor-origin offset cancels [-2,-3,-4] inside the angle-bracket asset.
  // Physical part bounds are X[-27,27], Y[-32,32], Z[0,70] in its datum frame.
  for (const [i, lo, hi] of [
    [0, -84, -14],
    [1, 1, 65],
    [2, -5, 49],
  ]) {
    expect(bounds.min[i]).toBeCloseTo(lo, 4)
    expect(bounds.max[i]).toBeCloseTo(hi, 4)
  }
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Side-mounted angle bracket: exported geometry follows the face frame",
    layout: "model_focus",
    panels: [
      {
        title: "Machined angle bracket on a vertical slotted plate",
        code: 'mountedTo=".BASE > .face"\nmountOffset={{x:2,y:3}} mountGap={4}\ncadModel.positionOffset={x:2,y:3,z:4}',
        annotation:
          "The slotted foot mates to the vertical plate; the circular pilot bore faces world +Z.\nCAD origin [18,24,36] mm; local XYZ maps to world YZX. Exported GLB bounds are asserted.",
        circuit,
        legend: [
          { color: "#2879b7", label: "Vertical slotted plate" },
          { color: "#a9b6c1", label: "90 degree angle bracket" },
        ],
        callouts: [
          { label: "4 mm face gap", at: [0.77, 0.28], target: [0.689, 0.461] },
        ],
        renderOptions: {
          camPos: [-160, 140, 180],
          poppygl: { lookAt: [-40, 30, 20] },
        },
      },
    ],
  })
})
