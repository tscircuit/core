import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic graphic rejects non-SVG image URLs", async () => {
  const { circuit } = getTestFixture()
  let asyncEffectError: string | undefined

  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncEffectError = event.error
  })

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic imageUrl="data:image/png;base64,iVBORw0KGgo=" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncEffectError).toContain(
    "Unsupported imageUrl for SchematicGraphic",
  )
  expect(circuit.db.schematic_graphic.list()).toHaveLength(0)
})
