import { expect, test } from "bun:test"
import { runAllPlacementChecks, runAllRoutingChecks } from "@tscircuit/checks"
import type { SolverStartedEvent } from "lib/events"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout hands a shared capacitor supply endpoint to both global branches", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  const solverNames: SolverStartedEvent["solverName"][] = []
  circuit.on("solver:started", ({ solverName }) => solverNames.push(solverName))

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      autorouter="default"
      autorouterVersion="beta_pipeline9"
      minTraceWidth="0.15mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.3mm"
      minViaPadDiameter="0.6mm"
    >
      <net name="GND" isGroundNet />
      <pinheader
        name="J1"
        pinCount={2}
        footprint="pinrow2"
        pinLabels={["GND", "VCC"]}
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={6}
        pcbY={-1.4}
      />
      <breakout
        name="DECOUPLING"
        pcbX={1.25}
        width="5.5mm"
        height="6.6mm"
        fanoutRoutingLayers={["top", "inner1", "inner2", "bottom"]}
        busFanoutDirections={{
          SUPPLY: "leftside_center",
          RETURN: "rightside_center",
        }}
      >
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={-1.25}
          pcbY={0}
        />
        <trace from="C1.pin2" to="net.GND" />
      </breakout>
      {/* Two real traces share each capacitor pad. Separate routing phases also
          exercise the saved base SRJ, not just the immediate fanout output. */}
      <trace
        name="SUPPLY_IN"
        from="J1.VCC"
        to="C1.pin1"
        routingPhaseIndex={1}
      />
      <bus
        name="SUPPLY"
        connections={["SUPPLY_IN"]}
        pcbAllowedLayers={["top"]}
        routingPhaseIndex={1}
      />
      <trace
        name="SUPPLY_LOAD"
        from="C1.pin1"
        to="R1.pin1"
        routingPhaseIndex={2}
      />
      <trace
        name="GROUND_IN"
        from="J1.GND"
        to="C1.pin2"
        routingPhaseIndex={3}
      />
      <trace
        name="GROUND_LOAD"
        from="R1.pin2"
        to="C1.pin2"
        routingPhaseIndex={3}
      />
      <bus
        name="RETURN"
        connections={["GROUND_IN", "GROUND_LOAD"]}
        routingPhaseIndex={3}
      />
      <pcbnotetext
        text="EXPECTED: BOTH BRANCHES MEET EACH C1 FANOUT EXIT"
        pcbY={5}
        fontSize="0.45mm"
        anchorAlignment="center"
      />
      <pcbnotetext
        text="C1 100nF AND R1 10k ACROSS J1 VCC / GND"
        pcbY={4.2}
        fontSize="0.4mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(solverNames).toContain("FanoutSolver")
  expect(solverNames).toContain(
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  )
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  const capacitor = circuit.db.source_component.getWhere({ name: "C1" })!
  const globalConnections = phases.flatMap(
    (phase) =>
      phase.startSimpleRouteJson?.connections.filter(
        (connection) => !connection.routingPcbGroupId,
      ) ?? [],
  )

  for (const [inputTraceName, loadTraceName] of [
    ["SUPPLY_IN", "SUPPLY_LOAD"],
    ["GROUND_IN", "GROUND_LOAD"],
  ]) {
    const inputTrace = circuit.db.source_trace.getWhere({
      name: inputTraceName,
    })!
    const loadTrace = circuit.db.source_trace.getWhere({ name: loadTraceName })!
    const sharedPortIds = inputTrace.connected_source_port_ids.filter(
      (portId) => loadTrace.connected_source_port_ids.includes(portId),
    )
    expect(sharedPortIds).toHaveLength(1)
    expect(
      circuit.db.source_port.get(sharedPortIds[0])?.source_component_id,
    ).toBe(capacitor.source_component_id)

    const breakoutPoint = circuit.db.pcb_breakout_point.getWhere({
      source_trace_id: inputTrace.source_trace_id,
    })!
    const initialBreakoutPoint = phases[0]
      .startSimpleRouteJson!.connections.flatMap(
        (connection) => connection.pointsToConnect,
      )
      .find((point) => point.pointId === breakoutPoint.pcb_breakout_point_id)!
    const movedEndpoint = {
      x: breakoutPoint.x,
      y: breakoutPoint.y,
      layer: breakoutPoint.layer,
    }
    expect(initialBreakoutPoint).not.toMatchObject(movedEndpoint)

    const inputConnection = globalConnections.find(
      (connection) => connection.source_trace_id === inputTrace.source_trace_id,
    )!
    const loadConnection = globalConnections.find(
      (connection) => connection.source_trace_id === loadTrace.source_trace_id,
    )!
    const inputEndpoint = inputConnection.pointsToConnect.find(
      (point) => point.pointId === breakoutPoint.pcb_breakout_point_id,
    )!
    const loadEndpoint = loadConnection.pointsToConnect.find(
      (point) => point.pointId === breakoutPoint.pcb_breakout_point_id,
    )!
    expect(inputEndpoint).toMatchObject(movedEndpoint)
    expect(loadEndpoint).toMatchObject(movedEndpoint)

    const tracesAtBreakout = circuit.db.pcb_trace
      .list()
      .filter((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            point.layer === breakoutPoint.layer &&
            Math.abs(point.x - breakoutPoint.x) < 1e-6 &&
            Math.abs(point.y - breakoutPoint.y) < 1e-6,
        ),
      )
    expect(tracesAtBreakout.length).toBeGreaterThanOrEqual(2)

    // The external component pads must never move with the shared junction.
    for (const connection of [inputConnection, loadConnection]) {
      const externalEndpoint = connection.pointsToConnect.find(
        (point) => point.pcb_port_id,
      )!
      const externalPort = circuit.db.pcb_port.get(
        externalEndpoint.pcb_port_id!,
      )!
      expect(externalEndpoint).toMatchObject({
        x: externalPort.x,
        y: externalPort.y,
      })
    }
  }

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(await runAllRoutingChecks(circuitJson)).toEqual([])
  expect(await runAllPlacementChecks(circuitJson)).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
