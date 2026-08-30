import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("pcbPack places bottom-layer decoupling under a fixed BGA", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="14mm" pcbPack pcbGap="0.2mm" routingDisabled>
      <chip
        name="U1"
        pcbX={2}
        pcbY={1}
        footprint="bga36_grid6x6_p0.8mm_pad0.35mm_circularpads"
      />
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

      <trace from=".U1 > .pin15" to=".C1 > .pin1" />
      <trace from=".U1 > .pin16" to=".C1 > .pin2" />
      <trace from=".U1 > .pin21" to=".C2 > .pin1" />
      <trace from=".U1 > .pin22" to=".C2 > .pin2" />

      <pcbnoterect
        pcbX={2}
        pcbY={1}
        width={5.2}
        height={5.2}
        color="#22c55e"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={2}
        pcbY={5.8}
        fontSize={0.5}
        color="#22c55e"
        text="FIXED TOP U1 @ (2, 1)"
      />
      <pcbnotetext
        pcbX={-3.2}
        pcbY={-5.25}
        fontSize={0.34}
        color="#22c55e"
        text="FIXED: BLUE CAPS PACK UNDER U1"
      />
      <pcbnotetext
        pcbY={-6.45}
        fontSize={0.4}
        color="#60a5fa"
        text="EXPECTED: BLUE BOTTOM C1/C2 UNDER U1 (SAME X/Y)"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceU1 = circuit.db.source_component.getWhere({ name: "U1" })!
  const u1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceU1.source_component_id,
  })!
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
    [getPcbPort("U1", "pin15"), getPcbPort("C1", "pin1")],
    [getPcbPort("U1", "pin16"), getPcbPort("C1", "pin2")],
    [getPcbPort("U1", "pin21"), getPcbPort("C2", "pin1")],
    [getPcbPort("U1", "pin22"), getPcbPort("C2", "pin2")],
  ].reduce((sum, [from, to]) => sum + distance(from, to), 0)

  expect(u1.center.x).toBeCloseTo(2, 6)
  expect(u1.center.y).toBeCloseTo(1, 6)
  expect(u1.layer).toBe("top")
  expect(totalConnectionDistance).toBeLessThan(2)
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })
})
