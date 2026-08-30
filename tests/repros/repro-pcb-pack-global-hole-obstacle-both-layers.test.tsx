import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack treats a standalone mechanical hole as an obstacle on both layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="13mm" pcbPack pcbGap="0.4mm" routingDisabled>
      <hole name="H_GLOBAL" pcbX={0} pcbY={0} diameter="4mm" />
      <resistor name="R_TOP" resistance="10k" footprint="0402" />
      <capacitor
        name="C_BOTTOM"
        capacitance="1uF"
        footprint="0603"
        layer="bottom"
      />

      <pcbnoterect
        pcbX={0}
        pcbY={0}
        width={4}
        height={4}
        color="#f59e0b"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4.7}
        fontSize={0.5}
        color="#f59e0b"
        text="BASELINE: GLOBAL 4MM HOLE BLOCKS BOTH PCB SIDES"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const getComponent = (name: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    return circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
  }
  const clearanceFromHoleBox = (component: {
    center: { x: number; y: number }
    width: number
    height: number
  }) => {
    const xClearance = Math.abs(component.center.x) - (2 + component.width / 2)
    const yClearance = Math.abs(component.center.y) - (2 + component.height / 2)
    return Math.max(xClearance, yClearance)
  }

  const topResistor = getComponent("R_TOP")
  const bottomCapacitor = getComponent("C_BOTTOM")

  expect(clearanceFromHoleBox(topResistor)).toBeGreaterThanOrEqual(0.39)
  expect(clearanceFromHoleBox(bottomCapacitor)).toBeGreaterThanOrEqual(0.39)
  expect(topResistor.layer).toBe("top")
  expect(bottomCapacitor.layer).toBe("bottom")
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
