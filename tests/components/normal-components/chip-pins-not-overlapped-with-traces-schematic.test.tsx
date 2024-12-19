import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {su} from "@tscircuit/soup-util"

test("chip pins not overlapped with schematic traces", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: "VCC",
          pin8: "GND",
        }}
        schPortArrangement={{
            topSize: 2,
            bottomSize: 2,
            leftSize: 4,
            rightSize: 4,
        }}
      />
      <resistor schX={-3} schY={0} resistance={100} name="R1" />

      {/* Right port side */}
      <trace from=".U1 > .8" to=".R1 > .2" />
      {/* Top port side */}
      <trace from=".U1 > .11" to=".R1 > .1" />
      {/* Bottom port side */}
      <trace from=".U1 > .5" to=".R1 > .2" />
      {/* Left port side */}
      <trace from=".U1 > .4" to=".R1 > .1" />

    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: {
      cellSize: 0.5,
      labelCells: true,
    },
  })

  const schematicTrace = su(circuit.getCircuitJson()).schematic_trace.list()
  
  expect(schematicTrace).toHaveLength(4)
})
