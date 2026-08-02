import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbOffsetX/pcbOffsetY are applied on top of edge-anchored positions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbLeftEdgeX={-10}
        pcbY={6}
        pcbOffsetY={-2}
      />
      <capacitor
        name="C2"
        capacitance="1uF"
        footprint="0402"
        pcbBottomEdgeY={8}
        pcbX={10}
        pcbOffsetX={-1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const centerOf = (name: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((sc) => sc.name === name)!
    return circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!.center
  }

  // C1 keeps its left edge at -10mm and moves 2mm down from pcbY
  expect(centerOf("C1").y).toBeCloseTo(4, 5)
  // C2 keeps its bottom edge at 8mm and moves 1mm left from pcbX
  expect(centerOf("C2").x).toBeCloseTo(9, 5)
})
