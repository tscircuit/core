import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPathRelativeTo preserves the from/to endpoints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-8}
        pcbY={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={8} pcbY={-4} />
      <resistor name="R3" resistance="1k" footprint="0603" pcbX={0} pcbY={4} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R3 > .pin1"
        pcbPath={[{ x: 0, y: -4 }]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.list()[0]!
  const sourcePinLabels = sourceTrace.connected_source_port_ids.map(
    (sourcePortId) => {
      const sourcePort = circuit.db.source_port.get(sourcePortId)!
      const sourceComponent = circuit.db.source_component.get(
        sourcePort.source_component_id!,
      )!
      return `${sourceComponent.name}.${sourcePort.name}`
    },
  )
  expect(sourcePinLabels.sort()).toEqual(["R1.pin2", "R2.pin1"])

  const pcbTrace = circuit.db.pcb_trace.list()[0]!
  const wirePoints = pcbTrace.route.filter(
    (routePoint) => routePoint.route_type === "wire",
  )
  const pcbPinLabels = [
    wirePoints[0]!.start_pcb_port_id!,
    wirePoints.at(-1)!.end_pcb_port_id!,
  ].map((pcbPortId) => {
    const pcbPort = circuit.db.pcb_port.get(pcbPortId)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id!)!
    const sourceComponent = circuit.db.source_component.get(
      sourcePort.source_component_id!,
    )!
    return `${sourceComponent.name}.${sourcePort.name}`
  })

  expect(pcbPinLabels.sort()).toEqual(["R1.pin2", "R2.pin1"])
  expect(wirePoints[1]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 0,
  })
})
