import { expect, test } from "bun:test"
import { assembly } from "lib"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("generic parts inherit assembly placement and can be screen attachment targets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      {createElement(
        assembly.screen,
        { name: "PARENT", connectsTo: ".U1", cadModel: "soic8" },
        <assembly.subassembly name="MODULE">
          <assembly.part
            name="BRACKET"
            cadModel={{
              jscad: { type: "cuboid", size: [12, 5, 3] },
              positionOffset: { x: 5, y: 0, z: 3 },
            }}
          />
        </assembly.subassembly>,
      )}
      <assembly.screen
        name="ATTACHED"
        connectsTo=".BRACKET"
        width={8}
        height={4}
      />
      <board width={30} height={20} routingDisabled>
        <chip name="U1" footprint="soic8" pcbX={4} pcbY={-3} pcbRotation={90} />
      </board>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cadFor = (name: string) => {
    const source = circuit.db.source_component
      .list()
      .find((s) => s.name === name)!
    return circuit.db.cad_component
      .list()
      .find((cad) => cad.source_component_id === source.source_component_id)!
  }
  const parent = cadFor("PARENT")
  const part = cadFor("BRACKET")
  expect(part.position.x).toBeCloseTo(parent.position.x)
  expect(part.position.y).toBeCloseTo(parent.position.y + 5)
  expect(part.position.z).toBeCloseTo(parent.position.z + 3)
  expect(part.rotation).toEqual(parent.rotation)
  expect(cadFor("ATTACHED").position).toEqual(parent.position)
  expect(cadFor("ATTACHED").rotation).toEqual(parent.rotation)
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Generic assembly part inherits its parent placement",
    panels: [
      {
        title: "Bracket on a rotated assembly",
        code: '<assembly.screen connectsTo=".U1">\n  <assembly.subassembly name="MODULE">\n    <assembly.part name="BRACKET"\n      cadModel={{ jscad: cuboid(12, 5, 3),\n        positionOffset: { x: 5, y: 0, z: 3 } }} />\n  </assembly.subassembly>\n</assembly.screen>\n<assembly.screen connectsTo=".BRACKET"\n  width={8} height={4} />',
        annotation:
          "Part inherits the parent frame; its CAD offset stays local.",
        circuit,
      },
    ],
  })
})
