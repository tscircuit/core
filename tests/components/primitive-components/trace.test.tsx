import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("simple trace test", async () => {
  const { project, logSoup } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-10}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)

  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
