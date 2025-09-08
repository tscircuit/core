import React from "react"
import { expect, test } from "bun:test"
import debug from "debug"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Test that schMarginX is passed to matchpack input problem

test("group schematic matchpack respects schMarginX", () => {
  debug.enable("Group_doInitialSchematicLayoutMatchpack")
  const { circuit } = getTestFixture()

  let capturedProblem: any
  circuit.on("debug:logOutput", (event) => {
    if (event.name === "matchpack-input-problem-G1") {
      capturedProblem = JSON.parse(event.content)
    }
  })

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1">
        <resistor name="R1" resistance="1k" footprint="0402" schMarginX={5} />
        <resistor name="R2" resistance="1k" footprint="0402" />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })
  const r1 = circuit.db.schematic_component.getWhere({
    source_component_id: r1Source!.source_component_id,
  })

  const r1Instance = circuit.selectOne("resistor[name=R1]") as any

  expect(capturedProblem).toBeDefined()
  const marginTotal = (r1Instance._parsedProps?.schMarginX || 0) * 2
  expect(capturedProblem.chipMap.R1.size.x - r1!.size.width).toBeCloseTo(
    marginTotal,
  )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
