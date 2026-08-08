import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("breakout routes qfp16 controller pins to header and passives with auto breakout points", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="20mm" height="16mm" autorouterVersion="latest">
      <breakout name="MCU_BREAKOUT" autorouter="auto" padding="2mm">
        <chip
          footprint="qfp16"
          name="U1"
          pinLabels={{
            pin1: "GPIO1",
            pin2: "GPIO2",
            pin3: "GPIO3",
            pin4: "GPIO4",
            pin5: "VCC",
            pin6: "GND",
            pin7: "SDA",
            pin8: "SCL",
            pin9: "RESET",
            pin10: "BOOT",
            pin11: "GPIO5",
            pin12: "GPIO6",
            pin13: "GPIO7",
            pin14: "GPIO8",
            pin15: "GPIO9",
            pin16: "GPIO10",
          }}
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={-3.5}
          pcbY={2.4}
        />
        <trace from="C1.1" to="U1.GPIO1" />
        <trace from="C1.2" to="U1.GPIO3" />
      </breakout>
      <pinheader
        name="J1"
        pinCount={4}
        footprint="pinrow4"
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        pcbX={7}
        pcbY={0}
        pcbRotation={90}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2.4}
        connections={{ pin1: "U1.RESET", pin2: "net.VCC" }}
      />
      <trace from="J1.VCC" to="U1.VCC" />
      <trace from="J1.GND" to="U1.GND" />
      <trace from="J1.SDA" to="U1.SDA" />
      <trace from="J1.SCL" to="U1.SCL" />
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
  const getSourcePortLabel = (sourcePortId: string): string => {
    const sourcePort = sourcePortsById.get(sourcePortId)
    const sourceComponent = sourcePort?.source_component_id
      ? sourceComponentsById.get(sourcePort.source_component_id)
      : undefined
    if (!sourcePort || !sourceComponent)
      throw new Error(`Could not resolve source port ${sourcePortId}`)
    return `${sourceComponent.name}.${sourcePort.name}`
  }
  const expectedPinLabelsBySourceTraceId = new Map(
    circuit.db.source_trace
      .list()
      .map((sourceTrace) => [
        sourceTrace.source_trace_id,
        new Set(sourceTrace.connected_source_port_ids.map(getSourcePortLabel)),
      ]),
  )
  expect(
    [...expectedPinLabelsBySourceTraceId.values()]
      .map((pinLabels) => [...pinLabels].sort())
      .sort((a, b) => a.join("|").localeCompare(b.join("|"))),
  ).toEqual([
    ["C1.pin1", "U1.GPIO1"],
    ["C1.pin2", "U1.GPIO3"],
    ["J1.GND", "U1.GND"],
    ["J1.SCL", "U1.SCL"],
    ["J1.SDA", "U1.SDA"],
    ["J1.VCC", "U1.VCC"],
    ["R1.pin1", "U1.RESET"],
    ["R1.pin2"],
  ])

  const routedPinLabelsBySourceTraceId = new Map<string, Set<string>>()
  for (const pcbTrace of circuit.db.pcb_trace.list()) {
    if (!pcbTrace.source_trace_id)
      throw new Error(
        `Routed trace ${pcbTrace.pcb_trace_id} is missing a source trace id`,
      )
    const routedPinLabels =
      routedPinLabelsBySourceTraceId.get(pcbTrace.source_trace_id) ??
      new Set<string>()
    routedPinLabelsBySourceTraceId.set(
      pcbTrace.source_trace_id,
      routedPinLabels,
    )
    const wirePoints = pcbTrace.route.filter(
      (routePoint) => routePoint.route_type === "wire",
    )
    const endpointPcbPortIds = [
      wirePoints[0]?.start_pcb_port_id,
      wirePoints.at(-1)?.end_pcb_port_id,
    ]
    for (const pcbPortId of endpointPcbPortIds) {
      if (!pcbPortId) continue
      const pcbPort = pcbPortsById.get(pcbPortId)
      if (pcbPort?.source_port_id)
        routedPinLabels.add(getSourcePortLabel(pcbPort.source_port_id))
    }
  }
  for (const [
    sourceTraceId,
    routedPinLabels,
  ] of routedPinLabelsBySourceTraceId) {
    expect([...routedPinLabels].sort()).toEqual(
      [...(expectedPinLabelsBySourceTraceId.get(sourceTraceId) ?? [])].sort(),
    )
  }

  const breakoutSourceGroup = circuit.db.source_group.getWhere({
    name: "MCU_BREAKOUT",
  })
  const breakoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: breakoutSourceGroup!.source_group_id,
  })

  expect(breakoutPcbGroup).toBeDefined()
  expect(circuit.db.pcb_breakout_point.list().length).toBe(5)
  expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(2)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(6)
  expect(circuit.db.pcb_via.list().length).toBeLessThanOrEqual(6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "breakout-qfp16-with-header-and-passives-autorouting-srj",
    circuit,
  )
  const drcErrors = circuit.db.pcb_trace_error.list()

  expect(drcErrors).toHaveLength(0)
  expect(
    drcErrors.filter((error) => error.message.includes("overlaps with")),
  ).toHaveLength(0)
  expect(
    drcErrors.filter((error) => error.message.includes("too close")),
  ).toHaveLength(0)
  expect(
    drcErrors.filter((error) =>
      error.message.includes("disconnected endpoint"),
    ),
  ).toHaveLength(0)
  expect(
    drcErrors.filter((error) => error.message.includes("missing a connection")),
  ).toHaveLength(0)
})
