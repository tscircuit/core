import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("repro: top-side decoupling misses a fixed bottom BGA target", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="15mm" pcbPack pcbGap="0.2mm" routingDisabled>
      <chip
        name="U_BOTTOM"
        pcbX={-3}
        pcbY={2}
        layer="bottom"
        footprint="bga36_grid6x6_p0.8mm_pad0.35mm_circularpads"
      />
      <capacitor name="C_TOP_1" capacitance="100nF" footprint="0402" />
      <capacitor name="C_TOP_2" capacitance="100nF" footprint="0402" />

      <trace from=".U_BOTTOM > .pin15" to=".C_TOP_1 > .pin1" />
      <trace from=".U_BOTTOM > .pin16" to=".C_TOP_1 > .pin2" />
      <trace from=".U_BOTTOM > .pin21" to=".C_TOP_2 > .pin1" />
      <trace from=".U_BOTTOM > .pin22" to=".C_TOP_2 > .pin2" />

      <pcbnoterect
        pcbX={-3}
        pcbY={2}
        width={5.2}
        height={5.2}
        color="#60a5fa"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={-3}
        pcbY={6.2}
        fontSize={0.5}
        color="#60a5fa"
        text="FIXED BOTTOM U_BOTTOM @ (-3, 2)"
      />
      <pcbnotetext
        pcbX={3.2}
        pcbY={-4.75}
        fontSize={0.34}
        color="#f59e0b"
        text="CURRENT BUG: RED CAPS MISS U_BOTTOM"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-6.35}
        fontSize={0.42}
        color="#ef4444"
        text="EXPECTED: RED TOP C_TOP_1/C_TOP_2 OVER U_BOTTOM (SAME X/Y)"
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
  const uBottom = getComponent("U_BOTTOM")
  const getPcbPort = (componentName: string, portName: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: componentName,
    })!
    const sourcePort = circuit.db.source_port.getWhere({
      source_component_id: sourceComponent.source_component_id,
      name: portName,
    })!
    return circuit.db.pcb_port.getWhere({
      source_port_id: sourcePort.source_port_id,
    })!
  }
  const totalConnectionDistance = [
    [getPcbPort("U_BOTTOM", "pin15"), getPcbPort("C_TOP_1", "pin1")],
    [getPcbPort("U_BOTTOM", "pin16"), getPcbPort("C_TOP_1", "pin2")],
    [getPcbPort("U_BOTTOM", "pin21"), getPcbPort("C_TOP_2", "pin1")],
    [getPcbPort("U_BOTTOM", "pin22"), getPcbPort("C_TOP_2", "pin2")],
  ].reduce((sum, [from, to]) => sum + distance(from, to), 0)

  expect(uBottom.center.x).toBeCloseTo(-3, 6)
  expect(uBottom.center.y).toBeCloseTo(2, 6)
  expect(uBottom.layer).toBe("bottom")
  expect(totalConnectionDistance).toBeGreaterThan(20)
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })
})
