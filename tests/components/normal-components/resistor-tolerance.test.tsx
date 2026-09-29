import { test, expect } from "bun:test"
import type { SourceSimpleResistor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor tolerance is emitted to source component", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        tolerance="5%"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="1k"
        tolerance={0.01}
        footprint="0402"
        pcbX={2}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as SourceSimpleResistor[]

  const r1 = resistors.find((r) => r.name === "R1")
  const r2 = resistors.find((r) => r.name === "R2")

  expect(r1?.tolerance).toBe(0.05)
  expect(r2?.tolerance).toBe(0.01)
})
