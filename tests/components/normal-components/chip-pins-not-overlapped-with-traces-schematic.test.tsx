import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pins not overlapped with schematic traces", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin8: "GND",
        }}
      />
      <resistor schX={-2} schY={0} resistance={100} name="R1" />
      <trace from=".U1 > .8" to=".R1 > .2" />
    </board>,
  )

  circuit.render()

  console.log(circuit.getCircuitJson().filter((elm) => elm.type === "schematic_trace"))

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: {
      cellSize: 0.5,
      labelCells: true,
    },
  })
})
