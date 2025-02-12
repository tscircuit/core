import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render an switch", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <switch name="switch" type="spst" schX={2} schY={2}/>
      <switch name="switch" spst schX={-2} schY={-2}/>
      <switch name="switch" type="spdt" schX={0} schY={0}/>
      <switch name="switch" schX={2} schY={-2}/>
      <switch name="switch" dpdt schX={-2} schY={2}/>
      <switch name="switch" type="spdt" schX={0} schY={0}/>

    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
