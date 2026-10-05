import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic trace solver refdes text box borders chip body", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <net name="VCC" />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
      <trace from=".U1 > .pin4" to="net.VCC" />
      <trace from=".U1 > .pin8" to="net.VCC" />
    </board>,
  )

  circuit.render()

  const schematicComponent = circuit.db.schematic_component.list()[0]
  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group<any>,
  )
  const refdesTextBox = inputProblem.textBoxes?.find(
    (textBox) => textBox.text === "U1",
  )

  expect(refdesTextBox).toBeDefined()
  const refdesBounds = {
    minX: refdesTextBox!.center.x - refdesTextBox!.width / 2,
    maxX: refdesTextBox!.center.x + refdesTextBox!.width / 2,
    minY: refdesTextBox!.center.y - refdesTextBox!.height / 2,
    maxY: refdesTextBox!.center.y + refdesTextBox!.height / 2,
  }
  const componentTop =
    schematicComponent.center.y + schematicComponent.size.height / 2

  expect(refdesBounds.minY).toBeLessThanOrEqual(componentTop)
  expect(refdesBounds.maxY).toBeGreaterThan(componentTop + 0.2)

  for (const trace of circuit.db.schematic_trace.list()) {
    for (const edge of trace.edges) {
      const isHorizontal = Math.abs(edge.from.y - edge.to.y) < 1e-9
      const isVertical = Math.abs(edge.from.x - edge.to.x) < 1e-9
      if (isHorizontal) {
        const overlapX =
          Math.min(Math.max(edge.from.x, edge.to.x), refdesBounds.maxX) -
          Math.max(Math.min(edge.from.x, edge.to.x), refdesBounds.minX)
        expect(
          edge.from.y > refdesBounds.minY &&
            edge.from.y < refdesBounds.maxY &&
            overlapX > 1e-9,
        ).toBe(false)
      } else if (isVertical) {
        const overlapY =
          Math.min(Math.max(edge.from.y, edge.to.y), refdesBounds.maxY) -
          Math.max(Math.min(edge.from.y, edge.to.y), refdesBounds.minY)
        expect(
          edge.from.x > refdesBounds.minX &&
            edge.from.x < refdesBounds.maxX &&
            overlapY > 1e-9,
        ).toBe(false)
      }
    }
  }
})
