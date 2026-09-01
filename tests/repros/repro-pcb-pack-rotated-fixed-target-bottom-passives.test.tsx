import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("pcbPack places bottom passives against a rotated fixed target", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="16mm" pcbPack pcbGap="0.2mm" routingDisabled>
      <chip
        name="U_ROTATED"
        pcbX={4}
        pcbY={-2}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2}
              pcbY={-0.6}
              width={0.8}
              height={1.1}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
              pcbY={0.8}
              width={0.8}
              height={1.1}
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={2}
              pcbY={-0.6}
              width={0.8}
              height={1.1}
              shape="rect"
            />
            <courtyardrect width={5.5} height={3} />
          </footprint>
        }
      />
      <resistor
        name="R_BOTTOM"
        resistance="1k"
        footprint="0402"
        layer="bottom"
      />
      <capacitor
        name="C_BOTTOM"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />

      <trace from=".U_ROTATED > .pin1" to=".R_BOTTOM > .pin1" />
      <trace from=".U_ROTATED > .pin2" to=".R_BOTTOM > .pin2" />
      <trace from=".U_ROTATED > .pin2" to=".C_BOTTOM > .pin1" />
      <trace from=".U_ROTATED > .pin3" to=".C_BOTTOM > .pin2" />

      <pcbnoterect
        pcbX={4}
        pcbY={-2}
        width={3}
        height={5.5}
        color="#22c55e"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={2}
        pcbY={5.7}
        fontSize={0.5}
        color="#22c55e"
        text="FIXED TOP U_ROTATED: 90 DEG @ (4, -2)"
      />
      <pcbnotetext
        pcbX={-3.5}
        pcbY={2.6}
        fontSize={0.38}
        color="#22c55e"
        text="FIXED: BLUE R/C FOLLOW TARGET"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-6.5}
        fontSize={0.48}
        color="#60a5fa"
        text="EXPECTED: BLUE BOTTOM R/C FOLLOW ROTATED TOP PAD LAYOUT"
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
  const uRotated = getComponent("U_ROTATED")
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
    [getPcbPort("U_ROTATED", "pin1"), getPcbPort("R_BOTTOM", "pin1")],
    [getPcbPort("U_ROTATED", "pin2"), getPcbPort("R_BOTTOM", "pin2")],
    [getPcbPort("U_ROTATED", "pin2"), getPcbPort("C_BOTTOM", "pin1")],
    [getPcbPort("U_ROTATED", "pin3"), getPcbPort("C_BOTTOM", "pin2")],
  ].reduce((sum, [from, to]) => sum + distance(from, to), 0)

  // The asymmetric footprint's pad-bounds center is 0.1 mm left of its
  // authored origin after the 90 degree rotation.
  expect(uRotated.center.x).toBeCloseTo(3.9, 6)
  expect(uRotated.center.y).toBeCloseTo(-2, 6)
  expect(uRotated.rotation).toBe(90)
  expect(totalConnectionDistance).toBeLessThan(4)
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })
})
