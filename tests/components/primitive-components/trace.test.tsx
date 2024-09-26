import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("simple trace test", async () => {
  const { project, logSoup } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        schX={-2}
      />
      <led name="LED1" footprint="0402" pcbX={2} schX={2} />
      <trace from=".R1 > .pin1" to=".LED1 > .anode" />
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
