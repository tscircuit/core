import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import { assembly, jscad, getAssemblyExplosion } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  mechanicalPlan,
  AngleBracket,
  SlottedPlate,
} from "./fixtures/mechanical-assembly-models"
import { withLocalBoltMesh } from "./fixtures/with-local-bolt-mesh"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("bolts follow tilted mechanical hole datums, relative offsets and exploded stages", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="MOUNT">
      <assembly.subassembly
        name="BRACKET"
        mountedTo=".FRAME > .seat"
        mountFace="base"
        mountOffset={{ x: 2, y: 3 }}
        mountGap={4}
        cadModel={{ jscad: mechanicalPlan(<AngleBracket />) }}
      >
        <assembly.bolt
          name="RIGHT"
          model="m3bolt"
          fastenedTo=".BRACKET > .slotRight"
        />
        <assembly.bolt
          name="LEFT"
          diameter={3}
          length="1cm"
          threadPitch={0.5}
          fastenedTo="BRACKET.slotLeft"
          mountOffset={{ y: 6 }}
        />
        <assembly.referencesurface name="base" normalDirection="z-" />
        <assembly.referencesurface
          name="slotRight"
          centerXOffset={17}
          centerZOffset={4}
        />
        <assembly.referencesurface
          name="slotLeft"
          centerXOffset={-17}
          centerZOffset={4}
        />
        <assembly.explosion.stage name="remove_bolts">
          <assembly.explosion.move targetRefs={["LEFT", "RIGHT"]} offZ={15} />
        </assembly.explosion.stage>
      </assembly.subassembly>
      <assembly.part
        name="FRAME"
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
          name="seat"
          plane="yz"
          centerXOffset={10}
          centerYOffset={20}
          centerZOffset={30}
        />
      </assembly.part>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cad = (name: string, json = circuit.getCircuitJson()) =>
    json.find(
      (record): record is CadComponent =>
        record.type === "cad_component" &&
        circuit.db.source_component.get(record.source_component_id!)?.name ===
          name,
    )!

  for (const [name, y, z] of [
    ["RIGHT", 39, 33],
    ["LEFT", 5, 39],
  ] as const) {
    expect(cad(name).position.x).toBeCloseTo(18, 5)
    expect(cad(name).position.y).toBeCloseTo(y, 5)
    expect(cad(name).position.z).toBeCloseTo(z, 5)
    expect(cad(name).model_glb_url).toBe(
      "https://modelcdn.tscircuit.com/jscad_models/hexsocketbolt_m3_l10mm.glb",
    )
  }
  const json = await withLocalBoltMesh(circuit.getCircuitJson())
  const right = cad("RIGHT")
  const bounds = await getRenderedMotorBounds(
    json.filter(
      (element) =>
        element.type === "cad_component" &&
        element.source_component_id === right.source_component_id,
    ),
  )
  // Socket head is toward circuit +X; the ten-mm shaft points toward -X.
  // Scene = (-circuit X, +circuit Z, +circuit Y).
  expect(bounds.min[0]).toBeCloseTo(-21, 4)
  expect(bounds.max[0]).toBeCloseTo(-8, 4)
  expect((bounds.min[1] + bounds.max[1]) / 2).toBeCloseTo(33, 4)
  expect((bounds.min[2] + bounds.max[2]) / 2).toBeCloseTo(39, 4)
  const exploded = getAssemblyExplosion(circuit, {
    throughStageRef: "MOUNT.BRACKET.remove_bolts",
  })
  for (const name of ["LEFT", "RIGHT"]) {
    const after = cad(name, exploded.circuitJson).position
    expect(after.x - cad(name).position.x).toBeCloseTo(15, 5)
    expect(after.y).toBeCloseTo(cad(name).position.y, 5)
    expect(after.z).toBeCloseTo(cad(name).position.z, 5)
  }
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Mechanical fastening: socket-head bolts follow slots in a tilted bracket",
    layout: "model_focus",
    panels: [
      {
        title: "Assembled: heads seat on the angle bracket's two slotted feet",
        code: '<assembly.bolt name="RIGHT"\n  model="m3bolt"\n  fastenedTo=\n    ".BRACKET > .slotRight"/>\n\n<assembly.bolt name="LEFT"\n  diameter={3} length="1cm"\n  fastenedTo="BRACKET.slotLeft"\n  mountOffset={{y:6}}/>',
        annotation:
          "The named slot datums coincide with real machined slots. The bracket is mounted to a vertical YZ plate.\nBoth heads seat at X=18; their shafts point along world -X. LEFT also moves 6 mm along its slot.",
        circuit: json,
        legend: [
          { color: "#a9b6c1", label: "JSCAD Electronics M3 socket heads" },
          { color: "#a9b6c1", label: "Machined aluminum angle bracket" },
          { color: "#2879b7", label: "Vertical slotted support plate" },
        ],
        renderOptions: {
          camPos: [-135, 115, 145],
          poppygl: { lookAt: [-40, 30, 20] },
        },
      },
      {
        title:
          "Exploded: both bolts withdraw 15 mm along the bracket's local +Z",
        code: '<assembly.explosion.stage\n  name="remove_bolts">\n  <assembly.explosion.move\n    targetRefs={["LEFT","RIGHT"]}\n    offZ={15}/>\n</assembly.explosion.stage>',
        annotation:
          "The bracket's local +Z is circuit +X. Each bolt moves outward 15 mm without changing its shaft direction.\nBolts work with existing assembly explosion stages; the bracket and support plate stay fixed.",
        circuit: await withLocalBoltMesh(exploded.circuitJson),
        legend: [
          { color: "#a9b6c1", label: "Both fasteners withdrawn" },
          { color: "#2879b7", label: "Support stays fixed" },
        ],
        renderOptions: {
          camPos: [-135, 115, 145],
          poppygl: { lookAt: [-40, 30, 20] },
        },
      },
    ],
  })
})
