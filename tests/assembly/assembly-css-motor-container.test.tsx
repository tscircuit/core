import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("an unmounted motor inherits a container's CSS face mount in the emitted GLB", async () => {
  const native = getTestFixture().circuit
  native.add(
    <assembly.device>
      <assembly.motor name="M" standard="nema17" />
    </assembly.device>,
  )
  await native.renderUntilSettled()
  const local = await getRenderedMotorBounds(
    await withLocalNemaMesh(native.getCircuitJson()),
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="BASE">
        <assembly.referencesurface
          name="motorFrame"
          plane="yz"
          centerXOffset={10}
          centerYOffset={20}
          centerZOffset={30}
        />
      </assembly.part>
      <assembly.subassembly
        name="BRIDGE"
        mountedTo=".BASE > .motorFrame"
        mountFace="base"
        mountOffset={{ x: 2, y: 3 }}
        mountGap={4}
      >
        <assembly.referencesurface name="base" normalDirection="z-" />
        <assembly.motor name="DRIVE" standard="nema17" />
      </assembly.subassembly>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component
    .list()
    .find((p) => p.name === "DRIVE")!
  const motor = circuit.db.cad_component
    .list()
    .find((p) => p.source_component_id === source.source_component_id)!
  expect(motor.position).toEqual({ x: 14, y: 22, z: 33 })
  const json = await withLocalNemaMesh(circuit.getCircuitJson())
  const world = await getRenderedMotorBounds(json)
  const min = [-14 - local.max[1], 33 + local.min[2], 22 - local.max[0]]
  const max = [-14 - local.min[1], 33 + local.max[2], 22 - local.min[0]]
  for (let i = 0; i < 3; i++) {
    expect(world.min[i]).toBeCloseTo(min[i], 3)
    expect(world.max[i]).toBeCloseTo(max[i], 3)
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "A constrained container carries its motor",
    panels: [
      {
        title: "Motor inherits the mounted bridge's full frame",
        code: 'BRIDGE mountedTo=".BASE > .motorFrame"\nmountFace="base"\nmountOffset={{x:2,y:3}} mountGap={4}\n  <assembly.motor name="DRIVE" standard="nema17"/>',
        annotation:
          "Motor origin [14,22,33] mm; native local +Z shaft now faces world +X.",
        circuit: json,
        showReferenceSurfaces: true,
        renderOptions: {
          camPos: [70, 70, 70],
          poppygl: { lookAt: [-5, 33, 22] },
        },
      },
    ],
  })
})
