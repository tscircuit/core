import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("CSS face constraints position geometry-less containers and their nested parts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.subassembly
        name="BRIDGE"
        mountedTo=".ROOT > [name='rail']"
        mountFace=".base"
        mountOffset={{ x: 5, y: -7 }}
        mountGap={2}
      >
        <assembly.referencesurface
          name="base"
          plane="xz"
          normalDirection="y-"
        />
        <assembly.referencesurface name="top" centerZOffset={10} />
        <assembly.part
          name="BEARING"
          cadModel={{
            jscad: {
              type: "colorize",
              color: [0.1, 0.45, 0.8],
              shape: { type: "cuboid", size: [6, 8, 4] },
            },
            positionOffset: { x: 3, y: 0, z: 2 },
          }}
        >
          <assembly.referencesurface name="child" centerXOffset={1} />
        </assembly.part>
        <assembly.subassembly
          name="TOOL"
          mountedTo="assemblyreferencesurface.top"
          mountFace="base"
          mountOffset={{ x: 2, y: 4 }}
          mountGap={1}
        >
          <assembly.referencesurface name="base" normalDirection="z-" />
          <assembly.part
            name="SPINDLE"
            cadModel={{
              jscad: {
                type: "colorize",
                color: [0.9, 0.35, 0.1],
                shape: { type: "cuboid", size: [2, 2, 8] },
              },
            }}
          />
        </assembly.subassembly>
      </assembly.subassembly>
      <assembly.part
        name="ROOT"
        cadModel={{
          jscad: { type: "cuboid", size: [50, 4, 50] },
          positionOffset: { x: 20, y: 28, z: 40 },
        }}
      >
        <assembly.referencesurface
          name="rail"
          plane="xz"
          centerXOffset={20}
          centerYOffset={30}
          centerZOffset={40}
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
  expect(cad("BEARING").position).toEqual({ x: 28, y: 32, z: 49 })
  expect(cad("SPINDLE").position).toEqual({ x: 27, y: 36, z: 58 })
  expect(
    circuit.db.cad_reference_surface
      .list()
      .find((face) => face.source_component_id === source("BEARING"))!.center,
  ).toEqual({ x: 26, y: 32, z: 47 })
  expect(circuit.db.cad_component.list()).toHaveLength(3)
  await expectAssemblySnapshot(import.meta.path, {
    title: "CSS face constraints carry nested assemblies",
    panels: [
      {
        title: "Face offsets position bridge and tool",
        code: 'BRIDGE mountedTo=".ROOT > [name=rail]"\nmountOffset={{x:5,y:-7}} mountGap={2}\nTOOL mountedTo="assemblyreferencesurface.top"\nmountOffset={{x:2,y:4}} mountGap={1}',
        annotation:
          "Bearing at [28,32,49]; spindle at [27,36,58] mm. Containers have no model.",
        circuit,
        showReferenceSurfaces: true,
        renderOptions: {
          camPos: [-65, 85, 100],
          poppygl: { lookAt: [-25, 45, 30] },
        },
      },
    ],
  })
})
