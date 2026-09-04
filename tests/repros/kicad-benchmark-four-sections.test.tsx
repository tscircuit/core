import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import KicadBenchmark from "./fixtures/kicad-benchmark-four-sections.fixture"

test("kicad benchmark renders four schematic sections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<KicadBenchmark />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sectionDividers = circuitJson.filter(
    (element) => element.type === "schematic_line",
  )
  const sectionTitles = circuitJson.filter(
    (element) =>
      element.type === "schematic_text" && element.text === "BOOT / STATUS",
  )

  expect(sectionDividers).toHaveLength(0)
  expect(sectionTitles).toHaveLength(1)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
