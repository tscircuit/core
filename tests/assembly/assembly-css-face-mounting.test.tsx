import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

import {
  mechanicalPlan,
  GantryFrame,
  LinearCarriage,
  SpindleClamp,
  SpindleDetails,
} from "./fixtures/mechanical-assembly-models"

test("CSS face constraints position geometry-less containers and their nested parts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.subassembly
        name="BRIDGE"
        mountedTo=".ROOT > .rail"
        mountFace=".base"
        mountOffset={{ x: 20, y: 0 }}
        mountGap={2}
      >
        <assembly.referencesurface
          name="base"
          plane="xz"
          normalDirection="y-"
        />
        <assembly.referencesurface
          name="toolMount"
          plane="xz"
          centerYOffset={14}
        />
        <assembly.part
          name="BEARING"
          cadModel={{
            jscad: mechanicalPlan(<LinearCarriage />),
            positionOffset: { x: 0, y: 7, z: 0 },
          }}
        >
          <assembly.referencesurface
            name="child"
            plane="xz"
            centerYOffset={14}
          />
        </assembly.part>
        <assembly.subassembly
          name="TOOL"
          mountedTo="assemblyreferencesurface.toolMount"
          mountFace="base"
          mountOffset={{ x: -5, y: 12 }}
          mountGap={3}
        >
          <assembly.referencesurface
            name="base"
            plane="xz"
            normalDirection="y-"
          />
          <assembly.part
            name="SPINDLE"
            cadModel={{
              jscad: mechanicalPlan(<SpindleClamp />),
            }}
          >
            <SpindleDetails />
          </assembly.part>
        </assembly.subassembly>
      </assembly.subassembly>
      <assembly.part
        name="ROOT"
        cadModel={{
          jscad: mechanicalPlan(<GantryFrame />),
        }}
      >
        <assembly.referencesurface
          name="rail"
          plane="xz"
          centerYOffset={10}
          centerZOffset={120}
        />
      </assembly.part>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const source = (name: string) =>
    circuit.db.source_component.list().find((part) => part.name === name)!
      .source_component_id
  const cad = (name: string) =>
    circuit.db.cad_component
      .list()
      .find((part) => part.source_component_id === source(name))!
  expect(cad("BEARING").position).toEqual({ x: 20, y: 19, z: 120 })
  expect(cad("SPINDLE").position).toEqual({ x: 15, y: 29, z: 108 })
  expect(
    circuit.db.cad_reference_surface
      .list()
      .find((face) => face.source_component_id === source("BEARING"))!.center,
  ).toEqual({ x: 20, y: 26, z: 120 })
  expect(circuit.db.cad_component.list()).toHaveLength(6)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Gantry: CSS faces position nested carriage and spindle assemblies",
    layout: "model_focus",
    panels: [
      {
        title: "Overview: extrusion gantry with a rail-mounted spindle",
        code: 'BRIDGE mountedTo=\n  ".ROOT > .rail"\nmountFace=".base"\nmountOffset={{x:20,y:0}}\nmountGap={2}\n\nTOOL mountedTo=\n  "assemblyreferencesurface.toolMount"\nmountFace="base"\nmountOffset={{x:-5,y:12}}\nmountGap={3}',
        annotation:
          "BRIDGE and TOOL have no model. Their children inherit the constrained frames.\nCarriage origin [20,19,120]; spindle origin [15,29,108] mm.",
        circuit,
        legend: [
          { color: "#a9b6c1", label: "T-slot frame + precision rail" },
          { color: "#2879b7", label: "Linear bearing carriage" },
          { color: "#df7929", label: "Split spindle clamp" },
          { color: "#b88d3f", label: "Collet + cutting tool below" },
        ],
        renderOptions: {
          camPos: [-240, 225, 310],
          poppygl: { lookAt: [0, 65, 20] },
        },
      },
      {
        title: "Detail: rail, carriage and nested tool mounting",
        code: "// Face-local offset directions\n// X = along the horizontal rail\n// Y = down the vertical face\n\nBRIDGE: +20 along rail\nTOOL:    -5 along rail\n         +12 down face\n\n// Gaps act normal to each face\nBRIDGE: 2 mm\nTOOL:   3 mm",
        annotation:
          "The blue bearing carriage belongs to BRIDGE; the orange clamp and spindle belong to TOOL.\nThe part's CAD offset does not shift its child reference surface: [20,26,120] mm.",
        circuit,
        legend: [
          { color: "#2879b7", label: "BRIDGE child: BEARING" },
          { color: "#df7929", label: "TOOL child: SPINDLE" },
        ],
        renderOptions: {
          camPos: [-85, 175, 165],
          poppygl: { lookAt: [-15, 105, 30] },
        },
      },
    ],
  })
})
