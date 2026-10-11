import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("printed-part color applies to imported models and JSX CAD children", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="ASSET"
        modelUrl="https://example.com/part.glb"
        color="blue"
        material="nylon"
      >
        <assembly.referencesurface name="board" centerZOffset="2mm" />
      </assembly.printedpart>
      <assembly.printedpart
        name="JSX"
        color="red"
        material="pla"
        cadModel={<cadmodel modelUrl="https://example.com/child.glb" />}
      />
    </assembly.device>,
  )
  circuit.render()
  const colors = circuit.db.cad_component
    .list()
    .map((cad) => cad.color)
    .sort()
  expect(colors).toEqual(["blue", "red"])
})
