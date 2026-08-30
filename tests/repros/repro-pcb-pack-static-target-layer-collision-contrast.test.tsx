import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("pcbPack clears a fixed target on the same side and overlaps it across layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="14mm" pcbPack pcbGap="0.3mm" routingDisabled>
      <chip
        name="U1"
        pcbX={3}
        pcbY={1}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-1.5}
              width={0.8}
              height={1.3}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={1.5}
              width={0.8}
              height={1.3}
              shape="rect"
            />
            <courtyardrect width={5} height={4} />
          </footprint>
        }
      />
      <resistor name="R_TOP" resistance="10k" footprint="0402" />
      <capacitor
        name="C_BOTTOM"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />

      <trace from=".U1 > .pin1" to=".R_TOP > .pin1" />
      <trace from=".U1 > .pin2" to=".R_TOP > .pin2" />
      <trace from=".U1 > .pin1" to=".C_BOTTOM > .pin1" />
      <trace from=".U1 > .pin2" to=".C_BOTTOM > .pin2" />

      <pcbnoterect
        pcbX={3}
        pcbY={1}
        width={5}
        height={4}
        color="#22c55e"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={5.6}
        fontSize={0.5}
        color="#ef4444"
        text="EXPECTED: RED TOP R_TOP CLEARS GREEN COURTYARD"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4.35}
        fontSize={0.38}
        color="#22c55e"
        text="FIXED: BLUE C_BOTTOM SITS INSIDE"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-5.6}
        fontSize={0.5}
        color="#60a5fa"
        text="EXPECTED: BLUE BOTTOM C_BOTTOM SITS INSIDE GREEN COURTYARD"
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
  const u1 = getComponent("U1")
  const topResistor = getComponent("R_TOP")
  const bottomCapacitor = getComponent("C_BOTTOM")
  const topCenterDistance = distance(u1.center, topResistor.center)
  const bottomCenterDistance = distance(u1.center, bottomCapacitor.center)
  const bottomConnectionDistance =
    distance(getPcbPort("U1", "pin1"), getPcbPort("C_BOTTOM", "pin1")) +
    distance(getPcbPort("U1", "pin2"), getPcbPort("C_BOTTOM", "pin2"))

  expect(u1.center.x).toBeCloseTo(3, 6)
  expect(u1.center.y).toBeCloseTo(1, 6)
  expect(topCenterDistance).toBeGreaterThan(2.7)
  expect(bottomCenterDistance).toBeLessThan(1.5)
  expect(bottomConnectionDistance).toBeLessThan(2.6)
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })
})
