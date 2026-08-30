import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("pcbPack fans bottom-side passives beneath an off-center fixed QFN", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="18mm" pcbPack pcbGap="0.25mm" routingDisabled>
      <chip name="U1" pcbX={4} pcbY={1.5} footprint="qfn32" />

      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />

      <trace from=".U1 > .pin1" to=".C1 > .pin1" />
      <trace from=".U1 > .pin2" to=".C1 > .pin2" />
      <trace from=".U1 > .pin9" to=".C2 > .pin1" />
      <trace from=".U1 > .pin10" to=".C2 > .pin2" />
      <trace from=".U1 > .pin17" to=".C3 > .pin1" />
      <trace from=".U1 > .pin18" to=".C3 > .pin2" />
      <trace from=".U1 > .pin25" to=".C4 > .pin1" />
      <trace from=".U1 > .pin26" to=".C4 > .pin2" />

      <pcbnoterect
        pcbX={4}
        pcbY={1.5}
        width={6.2}
        height={6.2}
        color="#22c55e"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={4}
        pcbY={6.4}
        fontSize={0.55}
        color="#22c55e"
        text="FIXED TOP QFN @ (4, 1.5)"
      />
      <pcbnotetext
        pcbX={-4}
        pcbY={-5.7}
        fontSize={0.38}
        color="#22c55e"
        text="FIXED: BLUE C1-C4 FAN IN UNDER U1"
      />
      <pcbnotetext
        pcbX={4}
        pcbY={-7.8}
        fontSize={0.45}
        color="#60a5fa"
        text="EXPECTED: BLUE BOTTOM C1-C4 UNDER U1 (SAME X/Y)"
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
  const u1 = getComponent("U1")
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
    [getPcbPort("U1", "pin1"), getPcbPort("C1", "pin1")],
    [getPcbPort("U1", "pin2"), getPcbPort("C1", "pin2")],
    [getPcbPort("U1", "pin9"), getPcbPort("C2", "pin1")],
    [getPcbPort("U1", "pin10"), getPcbPort("C2", "pin2")],
    [getPcbPort("U1", "pin17"), getPcbPort("C3", "pin1")],
    [getPcbPort("U1", "pin18"), getPcbPort("C3", "pin2")],
    [getPcbPort("U1", "pin25"), getPcbPort("C4", "pin1")],
    [getPcbPort("U1", "pin26"), getPcbPort("C4", "pin2")],
  ].reduce((sum, [from, to]) => sum + distance(from, to), 0)

  expect(u1.center.x).toBeCloseTo(4, 6)
  expect(u1.center.y).toBeCloseTo(1.5, 6)
  expect(totalConnectionDistance).toBeLessThan(9)
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })
})
