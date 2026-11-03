import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

import {
  mechanicalPlan,
  SlottedPlate,
} from "./fixtures/mechanical-assembly-models"

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
      <assembly.part
        name="BASE"
        cadModel={{
          jscad: mechanicalPlan(
            <jscad.translate offset={[10, 20, 30]}>
              <jscad.rotate angles={[Math.PI / 2, 0, Math.PI / 2]}>
                <SlottedPlate />
              </jscad.rotate>
            </jscad.translate>,
          ),
        }}
      >
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
        <assembly.referencesurface
          name="base"
          normalDirection="z-"
          centerZOffset={-40}
        />
        <assembly.printedpart
          name="STANDOFFS"
          jscad={
            <jscad.colorize color="#2879b7">
              <jscad.union>
                {[-15.5, 15.5].flatMap((x) =>
                  [-15.5, 15.5].map((y) => (
                    <jscad.subtract key={`${x},${y}`}>
                      <jscad.cylinder
                        radius={3.5}
                        height={4}
                        center={[x, y, -42]}
                      />
                      <jscad.cylinder
                        radius={1.7}
                        height={6}
                        center={[x, y, -42]}
                      />
                    </jscad.subtract>
                  )),
                )}
              </jscad.union>
            </jscad.colorize>
          }
        />
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
  expect(motor.position.x).toBeCloseTo(54)
  expect(motor.position.y).toBeCloseTo(22)
  expect(motor.position.z).toBeCloseTo(33)
  const json = await withLocalNemaMesh(circuit.getCircuitJson())
  const world = await getRenderedMotorBounds(
    json.filter(
      (element) =>
        element.type !== "cad_component" ||
        element.source_component_id === source.source_component_id,
    ),
  )
  const min = [-54 - local.max[1], 33 + local.min[2], 22 - local.max[0]]
  const max = [-54 - local.min[1], 33 + local.max[2], 22 - local.min[0]]
  for (let i = 0; i < 3; i++) {
    expect(world.min[i]).toBeCloseTo(min[i], 3)
    expect(world.max[i]).toBeCloseTo(max[i], 3)
  }
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Rear motor mount: a constrained container carries the NEMA17 and standoffs",
    layout: "model_focus",
    panels: [
      {
        title: "NEMA17 behind a slotted plate, supported by four blue spacers",
        code: 'BRIDGE mountedTo=\n  ".BASE > .motorFrame"\nmountFace="base"\nmountOffset={{x:2,y:3}}\nmountGap={4}\n\n// BRIDGE.base is at local Z=-40\n// Children inherit its full frame\n<assembly.motor\n  name="DRIVE" standard="nema17"/>\n<assembly.printedpart\n  name="STANDOFFS" ... />',
        annotation:
          "Motor origin [54,22,33] mm; the shaft points along world +X. Rear face is at X=14.\nThe four 4 mm standoffs bridge the gap to the plate at X=10; emitted motor GLB bounds are asserted.",
        circuit: json,
        legend: [
          { color: "#424a52", label: "JSCAD Electronics NEMA17" },
          { color: "#a9b6c1", label: "Slotted aluminum mount plate" },
          { color: "#2879b7", label: "Four 4 mm standoffs" },
        ],
        callouts: [
          { label: "4 mm standoff", at: [0.74, 0.26], target: [0.641, 0.36] },
        ],
        renderOptions: {
          camPos: [-170, 100, 150],
          poppygl: { lookAt: [-35, 30, 20] },
        },
      },
    ],
  })
})
