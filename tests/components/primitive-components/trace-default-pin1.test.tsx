import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("trace from/to defaults to pin1 when only component name is provided", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        schX={-2}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} schX={2} />
      <trace from="R1" to="R2" />
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
