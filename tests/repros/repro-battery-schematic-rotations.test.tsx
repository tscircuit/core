import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("battery schRotation at 0, 90, 180, and 270 degrees", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <battery name="BAT0" schX={-3} schY={3} schRotation={0} />
      <schematictext text="schRotation=0" fontSize={0.3} schX={-3} schY={1.5} />

      <battery name="BAT90" schX={3} schY={3} schRotation={90} />
      <schematictext text="schRotation=90" fontSize={0.3} schX={3} schY={1.5} />

      <battery name="BAT180" schX={-3} schY={-2} schRotation={180} />
      <schematictext
        text="schRotation=180"
        fontSize={0.3}
        schX={-3}
        schY={-3.5}
      />

      <battery name="BAT270" schX={3} schY={-2} schRotation={270} />
      <schematictext
        text="schRotation=270"
        fontSize={0.3}
        schX={3}
        schY={-3.5}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
