import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render an switch", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <switch name="SW1" type="spst" schX={2} schY={2} />
      <switch name="SW2" spst schX={-2} schY={-2} />
      <switch name="SW3" type="spdt" schX={0} schY={0} />
      <switch name="SW4" schX={2} schY={-2} />
      <switch name="SW5" dpdt schX={-2} schY={2} />
      <switch name="SW6" type="spdt" schX={0} schY={0} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
