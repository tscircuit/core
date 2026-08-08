import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("registers a differential pair routing constraint", async (): Promise<void> => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-2}
        pcbRotation={180}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={2}
        pcbRotation={180}
      />
      <led name="LED1" footprint="0402" pcbX={6} pcbY={-2} />
      <led name="LED2" footprint="0402" pcbX={6} pcbY={2} />
      <trace name="USB_P" from=".R1 > .pin1" to=".LED1 > .anode" />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        fontSize={1}
        text="USB differential pair: USB_P / USB_N (max skew: 0.05)"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "pcb_trace")
  const subcircuitComponent = circuit.firstChild
  if (!subcircuitComponent) {
    throw new Error("Expected the circuit to contain a board")
  }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent,
  })
  const positiveTrace = circuit.db.source_trace.getWhere({ name: "USB_P" })
  if (!positiveTrace) {
    throw new Error("Expected the USB_P source trace")
  }
  const negativeTrace = circuit.db.source_trace.getWhere({ name: "USB_N" })
  if (!negativeTrace) {
    throw new Error("Expected the USB_N source trace")
  }
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        positiveTrace.source_trace_id,
        negativeTrace.source_trace_id,
      ],
      lengthTolerance: 0.05,
    },
  ])

  const sourcePortsById = new Map(
    circuit.db.source_port
      .list()
      .map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
  )
  const sourceComponentsById = new Map(
    circuit.db.source_component
      .list()
      .map((sourceComponent) => [
        sourceComponent.source_component_id,
        sourceComponent,
      ]),
  )
  const pcbPortsById = new Map(
    circuit.db.pcb_port.list().map((pcbPort) => [pcbPort.pcb_port_id, pcbPort]),
  )
  const pcbTraces = circuit.db.pcb_trace.list()
  const routedPinLabelsBySourceTraceId = Object.fromEntries(
    pcbTraces.map((pcbTrace) => {
      const wirePoints = pcbTrace.route.filter(
        (routePoint) => routePoint.route_type === "wire",
      )
      const endpointPcbPortIds = [
        wirePoints[0]?.start_pcb_port_id,
        wirePoints.at(-1)?.end_pcb_port_id,
      ]
      if (!pcbTrace.source_trace_id || endpointPcbPortIds.some((id) => !id))
        throw new Error(
          `Routed trace ${pcbTrace.pcb_trace_id} is missing endpoint metadata`,
        )
      const routedPinLabels = endpointPcbPortIds.map((pcbPortId) => {
        if (!pcbPortId)
          throw new Error(
            `Routed trace ${pcbTrace.pcb_trace_id} has an empty endpoint id`,
          )
        const pcbPort = pcbPortsById.get(pcbPortId)
        const sourcePort = pcbPort?.source_port_id
          ? sourcePortsById.get(pcbPort.source_port_id)
          : undefined
        const sourceComponent = sourcePort?.source_component_id
          ? sourceComponentsById.get(sourcePort.source_component_id)
          : undefined
        if (!sourcePort || !sourceComponent)
          throw new Error(`Could not resolve routed endpoint ${pcbPortId}`)
        return `${sourceComponent.name}.${sourcePort.name}`
      })
      return [pcbTrace.source_trace_id, routedPinLabels.sort()]
    }),
  )
  expect(routedPinLabelsBySourceTraceId).toEqual({
    source_trace_0: ["LED1.pin1", "R1.pin1"],
    source_trace_1: ["LED2.pin1", "R2.pin1"],
  })

  const routedLengthsBySourceTraceId = Object.fromEntries(
    pcbTraces.map((pcbTrace) => {
      if (!pcbTrace.source_trace_id)
        throw new Error(
          `Routed trace ${pcbTrace.pcb_trace_id} is missing a source trace id`,
        )
      const wirePoints = pcbTrace.route.filter(
        (routePoint) => routePoint.route_type === "wire",
      )
      const routedLength = wirePoints
        .slice(1)
        .reduce((totalLength, routePoint, routePointIndex) => {
          const previousPoint = wirePoints[routePointIndex]!
          return (
            totalLength +
            Math.hypot(
              routePoint.x - previousPoint.x,
              routePoint.y - previousPoint.y,
            )
          )
        }, 0)
      return [pcbTrace.source_trace_id, routedLength]
    }),
  )
  expect(
    Math.abs(
      routedLengthsBySourceTraceId.source_trace_0! -
        routedLengthsBySourceTraceId.source_trace_1!,
    ),
  ).toBeLessThanOrEqual(0.05)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
