import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test.failing("pcbPack places bottom-layer decoupling capacitors underneath a BGA", async () => {
  const { circuit } = getTestFixture()

  // pcbPack defaults to minimum_sum_squared_distance_to_network.
  circuit.add(
    <board width="16mm" height="14mm" pcbPack pcbGap="0.2mm" routingDisabled>
      <chip name="U1" footprint="bga36_grid6x6_p0.8mm_pad0.35mm_circularpads" />
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

      <pcbnotetext
        pcbY={-6}
        fontSize={0.45}
        text="Bottom C1/C2 should pack directly underneath U1"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const getPcbPortCenter = (componentName: string, portName: string) => {
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

  const connectedPortPairs = [
    [getPcbPortCenter("U1", "pin15"), getPcbPortCenter("C1", "pin1")],
    [getPcbPortCenter("U1", "pin16"), getPcbPortCenter("C1", "pin2")],
    [getPcbPortCenter("U1", "pin21"), getPcbPortCenter("C2", "pin1")],
    [getPcbPortCenter("U1", "pin22"), getPcbPortCenter("C2", "pin2")],
  ] as const
  const totalStraightLineConnectionDistance = connectedPortPairs.reduce(
    (total, [from, to]) => total + distance(from, to),
    0,
  )

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
  })
  // Centering the capacitors on the two connected BGA rows gives about
  // 0.44 mm total distance; 2 mm leaves room for sequential packing choices.
  expect(totalStraightLineConnectionDistance).toBeLessThan(2)
})
