import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import modeling from "@jscad/modeling"
import { executeJscadOperations, type JscadOperation } from "jscad-planner"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

import { SpacerSolid } from "./fixtures/motor-spacer"
import { SlottedPlate } from "./fixtures/mechanical-assembly-models"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"

test("CSS selectors address generated JSCAD datums and offsets follow rotated face tangents", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="CLAMP"
        mountedTo="[name='STAND'] > [name='top']"
        mountFace=".base"
        mountOffset={{ x: 4, y: -2 }}
        mountGap={3}
        jscad={
          <>
            <jscad.colorize color="#2879b7">
              <SpacerSolid height={12} />
            </jscad.colorize>
            <jscad.translate offset={[0, 0, 12]}>
              <jscad.rectangle name="motor" reference size={[42, 42]} />
            </jscad.translate>
            <jscad.rotate angles={[Math.PI, 0, 0]}>
              <jscad.rectangle name="base" reference size={[2, 2]} />
            </jscad.rotate>
          </>
        }
      />
      <assembly.motor
        name="DRIVE"
        standard="nema17"
        mountedTo=".CLAMP > .motor"
        mountFace="frontface"
      />
      <assembly.printedpart
        name="STAND"
        jscad={
          <>
            <jscad.translate offset={[10, 20, 12]}>
              <SlottedPlate />
            </jscad.translate>
            <jscad.translate offset={[10, 20, 12]}>
              <jscad.rotate angles={[0, 0, Math.PI / 2]}>
                <jscad.rectangle name="top" reference size={[24, 24]} />
              </jscad.rotate>
            </jscad.translate>
          </>
        }
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component
    .list()
    .find((p) => p.name === "CLAMP")!
  const cad = circuit.db.cad_component
    .list()
    .find((p) => p.source_component_id === source.source_component_id)!
  expect(cad.position.x).toBeCloseTo(12)
  expect(cad.position.y).toBeCloseTo(24)
  expect(cad.position.z).toBeCloseTo(15)
  const solid = modeling.transforms.translate(
    [cad.position.x, cad.position.y, cad.position.z],
    executeJscadOperations(modeling as any, cad.model_jscad as JscadOperation),
  )
  const [min, max] = modeling.measurements.measureBoundingBox(solid)
  for (const [i, value] of [12, 24, 21].entries())
    expect((min[i] + max[i]) / 2).toBeCloseTo(value)
  const json = await withLocalNemaMesh(circuit.getCircuitJson())
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Adjustable motor mount: CSS selectors address generated JSCAD faces",
    layout: "model_focus",
    panels: [
      {
        title: "NEMA17 on a printed spacer and slotted mounting plate",
        code: 'mountedTo="[name=STAND] > [name=top]"\nmountFace=".base"\nmountOffset={{x:4,y:-2}} mountGap={3}',
        annotation:
          "The plate datum is rotated 90 degrees: offset +4 moves world +Y; offset -2 moves world +X.\nSpacer base [12,24,15] mm, with a 3 mm inspection gap above the plate at Z=12.",
        circuit: json,
        legend: [
          { color: "#424a52", label: "JSCAD Electronics NEMA17" },
          { color: "#2879b7", label: "Printed four-post spacer" },
          { color: "#a9b6c1", label: "Slotted aluminum plate" },
        ],
        renderOptions: {
          camPos: [-110, 120, 160],
          poppygl: { lookAt: [-10, 30, 20] },
        },
      },
      {
        title:
          "Underside: adjustment slots, shaft clearance and the 3 mm face gap",
        code: "// Generated STAND.top datum\n// Origin: [10,20,12]\n// Tangents rotated 90 degrees\n\nmountOffset={{x:4,y:-2}}\nmountGap={3}\n\n// Generated CLAMP.base datum\n// Outward normal: local -Z",
        annotation:
          "The pilot shaft passes through the spacer and plate bores. Four slots allow lateral adjustment.\nThis camera exposes the plate underside; the blue spacer sits 3 mm above its upper face.",
        circuit: json,
        legend: [
          { color: "#a9b6c1", label: "60 x 60 x 6 mm slotted plate" },
          { color: "#2879b7", label: "12 mm printed spacer" },
        ],
        callouts: [
          { label: "3 mm gap", at: [0.77, 0.43], target: [0.67, 0.5] },
        ],
        renderOptions: {
          camPos: [-95, -45, 140],
          poppygl: { lookAt: [-10, 20, 20] },
        },
      },
    ],
  })
})
