import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const fallbackSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><rect width="20" height="10" fill="green" /></svg>'

test("schematic graphic rejects a malformed inline image asset before fallback", async () => {
  const { circuit } = getTestFixture()
  let asyncEffectError: string | undefined

  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncEffectError = event.error
  })

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic
          imageUrl="data:image/svg+xml,%E0%A4%A"
          svgContent={fallbackSvg}
        />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncEffectError).toBeDefined()
  expect(circuit.db.schematic_graphic.list()).toHaveLength(0)
})
