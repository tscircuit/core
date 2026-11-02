import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("tilted mounts keep CAD offsets and exported anisotropic geometry aligned with datums", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="BASE">
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
          jscad: { type: "cuboid", size: [2, 4, 8] },
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
  const bounds = await getRenderedMotorBounds(circuit.getCircuitJson())
  // Native GLB uses (-X, +Z, +Y). The YZ target maps local XYZ -> world YZX.
  // Offsets place its center at [18,24,36], with half-extents [4,1,2].
  for (const [i, lo, hi] of [
    [0, -22, -14],
    [1, 34, 38],
    [2, 23, 25],
  ]) {
    expect(bounds.min[i]).toBeCloseTo(lo, 4)
    expect(bounds.max[i]).toBeCloseTo(hi, 4)
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Mounted CAD geometry matches its tilted reference frame",
    panels: [
      {
        title: "YZ mounting plane with signed offsets",
        code: 'mountedTo=".BASE > .face"\nmountOffset={{x:2,y:3}} mountGap={4}\ncadModel.positionOffset={x:2,y:3,z:4}',
        annotation: "Part center [18,24,36] mm; local XYZ maps to world YZX.",
        circuit,
        showReferenceSurfaces: true,
        renderOptions: {
          camPos: [-35, 55, 45],
          poppygl: { lookAt: [-18, 36, 24] },
        },
      },
    ],
  })
})
