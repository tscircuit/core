import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("a generic part's child reference surface anchors a board without rendering a surface", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="BRACKET"
        cadModel={{ jscad: { type: "cuboid", size: [24, 16, 2] } }}
      >
        <assembly.referencesurface
          shape="rect"
          plane="xy"
          centerZOffset="1mm"
        />
      </assembly.part>
      <board
        name="B1"
        width={24}
        height={16}
        thickness={1.6}
        mountedTo="BRACKET.anchor"
        mountGap="2mm"
        pcbX={4}
        pcbY={3}
        routingDisabled
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(1)
  expect(cad[0].position).toEqual({ x: 4, y: 3, z: -3.8 })
  expect(circuit.db.pcb_board.list()[0].center).toEqual({ x: 4, y: 3 })
  expect(
    circuit.db.source_component
      .list()
      .some((source) => source.name === "anchor"),
  ).toBe(false)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Reference surface on a generic part",
    panels: [
      {
        title: "2 mm surface clearance below the PCB",
        code: '<assembly.part name="BRACKET" cadModel={...}>\n  <assembly.referencesurface\n    shape="rect" plane="xy"\n    centerZOffset="1mm" />\n</assembly.part>\n<board mountedTo="BRACKET.anchor"\n  mountGap="2mm" thickness={1.6} />',
        annotation:
          "The reference surface locates the mount; it adds no material.",
        circuit,
        renderOptions: {
          camPos: [35, 25, 40],
          poppygl: { lookAt: [4, -1, 3] },
        },
      },
    ],
  })
})
