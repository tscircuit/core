import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb rotation", async () => {
  const { project, logSoup } = getTestFixture()

  project.add(
    <board width={12} height={4}>
      <resistor name="R1" pcbX={-5} footprint="soic8" resistance="1k" />
      <resistor
        name="R2"
        pcbX={5}
        footprint="soic8"
        resistance="1k"
        pcbRotation={90}
      />
    </board>,
  )

  project.render()

  expect(project.getCircuitJson()).toMatchPcbSnapshot(import.meta.dir)
})
