import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb circular hole rect plated", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <platedhole
        shape="circularHoleWithRectPad"
        holeDiameter={2}
        rectPadWidth={4}
        rectPadHeight={4}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
