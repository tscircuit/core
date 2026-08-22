import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pipeline7 routes both differential pair traces in the same routing phase", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="20mm" height="20mm" autorouterVersion="beta_pipeline7">
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <trace
        name="USB_P"
        from=".U1 > .pin1"
        to=".U2 > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="USB_N"
        from=".U1 > .pin2"
        to=".U2 > .pin6"
        routingPhaseIndex={0}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4}
        fontSize={0.8}
        text="USB differential pair: routing phase 0"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

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
      return [pcbTrace.source_trace_id, routedPinLabels]
    }),
  )
  expect(routedPinLabelsBySourceTraceId).toEqual({
    source_trace_0: ["U1.pin1", "U2.pin1"],
    source_trace_1: ["U1.pin2", "U2.pin6"],
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

  expect(
    autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.differentialPairs,
  ).toHaveLength(1)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "differential-pair-routing-phase",
    circuit,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
