import type { PcbTrace, SourceTrace } from "circuit-json"
import { Fragment } from "react"
import type { RootCircuit } from "lib/RootCircuit"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

interface MemoryBytePlatedHoleFixture {
  circuit: RootCircuit
  input: SimpleRouteJson
  groundTrace: PcbTrace
  signalSourceTraces: SourceTrace[]
}

/**
 * Reduced four-layer memory section in board-world mm (+X right, +Y up).
 * BGA pad coordinates are footprint-local points translated by their chips.
 * Facing DQ balls isolate bus routing from the preceding package escape phase.
 */
export function getMemoryBytePlatedHoleFixture(): MemoryBytePlatedHoleFixture {
  const { circuit } = getTestFixture()
  const controllerLabels = Object.fromEntries(
    Array.from({ length: 100 }, (_, pinIndex) => [
      `pin${pinIndex + 1}`,
      `IO${pinIndex + 1}`,
    ]),
  )
  const memoryLabels = Object.fromEntries(
    Array.from({ length: 96 }, (_, pinIndex) => [
      `pin${pinIndex + 1}`,
      `IO${pinIndex + 1}`,
    ]),
  )
  for (let bit = 0; bit < 8; bit++) {
    controllerLabels[`pin${(bit + 1) * 10 + 10}`] = `DQ${bit}`
    memoryLabels[`pin${bit * 12 + 1}`] = `DQ${bit}`
  }
  controllerLabels.pin1 = "VDD"
  controllerLabels.pin100 = "GND"
  memoryLabels.pin12 = "VDD"
  memoryLabels.pin96 = "GND"
  circuit.add(
    <board
      width={30}
      height={20}
      layers={4}
      routingDisabled
      schematicDisabled
      minTraceWidth={0.12}
      minTraceToPadEdgeClearance={0.1}
      minTraceToHoleEdgeClearance={0.1}
    >
      <chip name="U1" pinLabels={controllerLabels} pcbX={-8} pcbY={1}>
        <footprint>
          {Array.from({ length: 100 }, (_, padIndex) => (
            <Fragment key={`controller_${padIndex}`}>
              <smtpad
                shape="circle"
                radius={0.175}
                pcbX={((padIndex % 10) - 4.5) * 0.65}
                pcbY={(4.5 - Math.floor(padIndex / 10)) * 0.65}
                portHints={[`pin${padIndex + 1}`]}
              />
            </Fragment>
          ))}
        </footprint>
      </chip>
      <chip name="U2" pinLabels={memoryLabels} pcbX={8} pcbY={1}>
        <footprint>
          {Array.from({ length: 96 }, (_, padIndex) => (
            <Fragment key={`memory_${padIndex}`}>
              <smtpad
                shape="circle"
                radius={0.2}
                pcbX={((padIndex % 12) - 5.5) * 0.8}
                pcbY={(3.5 - Math.floor(padIndex / 12)) * 0.8}
                portHints={[`pin${padIndex + 1}`]}
              />
            </Fragment>
          ))}
        </footprint>
      </chip>
      {Array.from({ length: 8 }, (_, bit) => (
        <trace
          key={`DQ${bit}`}
          name={`DQ${bit}`}
          from={`U1.DQ${bit}`}
          to={`U2.DQ${bit}`}
          thickness={0.12}
        />
      ))}
      {Array.from({ length: 8 }, (_, capIndex) => (
        <capacitor
          key={`C${capIndex + 1}`}
          name={`C${capIndex + 1}`}
          capacitance="100nF"
          footprint="0402"
          pcbX={(capIndex < 4 ? -11.3 : 4.7) + (capIndex % 4) * 2.2}
          pcbY={-4.3}
          connections={{ pin1: "net.VDD", pin2: "net.GND" }}
        />
      ))}
      <chip name="J1" pinLabels={{ pin1: "GND" }} pcbY={-4.5}>
        <footprint>
          <platedhole
            shape="circle"
            outerDiameter={1.2}
            holeDiameter={0.6}
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padDiameter={0.8}
        layer="bottom"
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
        pcbX={-3}
        pcbY={-6.2}
      />
      <trace name="GND_RETURN" from="TP1.pin1" to="J1.GND" />
      <net name="GND" connectsTo={["J1.GND", "U1.GND", "U2.GND"]} />
      <net name="VDD" connectsTo={["U1.VDD", "U2.VDD"]} />
      <copperpour
        name="GROUND_PLANE"
        layer="inner1"
        connectsTo="net.GND"
        outline={[
          { x: -14, y: -7.2 },
          { x: 14, y: -7.2 },
          { x: 14, y: -5.7 },
          { x: 1, y: -5.7 },
          { x: 1, y: -3.8 },
          { x: -1, y: -3.8 },
          { x: -1, y: -5.7 },
          { x: -14, y: -5.7 },
        ]}
      />
      <pcbnotetext
        text="Memory byte-lane handoff | Four layers | Eight DQ signals"
        pcbY={8.5}
        fontSize={0.45}
        color="#202832"
      />
      <pcbnotetext
        text="U1 CONTROLLER | BGA100, 0.65mm"
        pcbX={-8}
        pcbY={5.3}
        fontSize={0.32}
        color="#202832"
      />
      <pcbnotetext
        text="U2 MEMORY | BGA96, 0.8mm"
        pcbX={8}
        pcbY={5.3}
        fontSize={0.32}
        color="#202832"
      />
      <pcbnotetext
        text="J1: existing GND plated hole"
        pcbY={-3.3}
        fontSize={0.26}
        color="#202832"
      />
      <pcbnotetext
        text="TP1 GND"
        pcbX={-3.8}
        pcbY={-6.8}
        fontSize={0.23}
        color="#202832"
      />
      <pcbnotetext
        text="Earlier ground route: bottom (blue) → plated hole → inner1 (orange)"
        pcbY={-7.7}
        fontSize={0.3}
        color="#202832"
      />
    </board>,
  )
  circuit.render()
  const groundSourceTrace = circuit.db.source_trace.getWhere({
    name: "GND_RETURN",
  })!
  const hole = circuit.db.pcb_plated_hole.list()[0]!
  const groundSourcePortIds = new Set(
    groundSourceTrace.connected_source_port_ids,
  )
  const testpointPort = circuit.db.pcb_port
    .list()
    .find(
      (port) =>
        groundSourcePortIds.has(port.source_port_id!) &&
        port.layers.length === 1 &&
        port.layers[0] === "bottom",
    )!
  // Board-world contact on the PTH copper annulus (0.3–0.6 mm radius).
  const groundContact = { x: hole.x - 0.45, y: hole.y }
  const groundTrace = circuit.db.pcb_trace.insert({
    source_trace_id: groundSourceTrace.source_trace_id,
    subcircuit_id: groundSourceTrace.subcircuit_id!,
    route: [
      {
        route_type: "wire",
        x: testpointPort.x,
        y: testpointPort.y,
        layer: "bottom",
        width: 0.3,
        start_pcb_port_id: testpointPort.pcb_port_id,
      },
      { route_type: "wire", ...groundContact, layer: "bottom", width: 0.3 },
      {
        route_type: "through_pad",
        start: groundContact,
        end: groundContact,
        start_layer: "bottom",
        end_layer: "inner1",
        width: 0.3,
        pcb_plated_hole_id: hole.pcb_plated_hole_id,
      },
      { route_type: "wire", ...groundContact, layer: "inner1", width: 0.3 },
      {
        route_type: "wire",
        x: groundContact.x,
        y: groundContact.y + 0.2,
        layer: "inner1",
        width: 0.3,
        end_pcb_port_id: hole.pcb_port_id,
      },
    ],
  })
  const signalSourceTraces = circuit.db.source_trace
    .list()
    .filter((trace) => /^DQ[0-7]$/.test(trace.name ?? ""))
  const signalTraceIds = new Set(
    signalSourceTraces.map((trace) => trace.source_trace_id),
  )
  const generated = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  }).simpleRouteJson
  const input: SimpleRouteJson = {
    ...generated,
    connections: generated.connections.filter((connection) =>
      signalTraceIds.has(connection.name),
    ),
    buses: [
      {
        busId: "DDR_BYTE",
        connectionNames: [...signalTraceIds],
        allowedLayers: ["top"],
        traceWidth: 0.12,
      },
    ],
    defaultObstacleMargin: 0.1,
  }
  for (const connection of input.connections) {
    const sourceTrace = signalSourceTraces.find(
      (trace) => trace.source_trace_id === connection.name,
    )!
    for (const point of connection.pointsToConnect.filter(
      (point) => point.x > 0,
    )) {
      circuit.db.pcb_note_text.insert({
        text: sourceTrace.name!,
        anchor_position: {
          x: point.x - 0.8,
          y: point.y + 0.22,
        },
        anchor_alignment: "center",
        font: "tscircuit2024",
        font_size: 0.22,
        color: "#202832",
        layer: "top",
      })
    }
  }
  return { circuit, input, groundTrace, signalSourceTraces }
}
