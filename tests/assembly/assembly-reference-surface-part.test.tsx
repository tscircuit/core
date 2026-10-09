import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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
})
