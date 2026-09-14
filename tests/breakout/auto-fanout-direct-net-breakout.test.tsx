import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("auto fanout creates exits for component ports connected directly to a shared net", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="18mm"
      height="12mm"
      layers={4}
      autorouter="default"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <copperpour layer="inner1" connectsTo="net.GND" />
      <net name="SHARED" />
      <fanout name="U1_FANOUT" autorouter="auto" padding="1.2mm" pcbX={-3}>
        <chip
          name="U1"
          noSchematicRepresentation
          pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "GND" }}
          connections={{ A: "net.SHARED", B: "net.SHARED", GND: "net.GND" }}
          pcbX={2.5}
          pcbY={2}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={-0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin3"]}
                pcbY={0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin4"]}
                pcbY={-0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
            </footprint>
          }
        />
        <trace from="U1.C" to="U1.A" />
      </fanout>

      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        connections={{ pin1: "net.SHARED" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1 = circuit.db.source_component.getWhere({ name: "U1" })!
  const u1PortIds = new Set(
    circuit.db.source_port
      .list()
      .filter((port) => port.source_component_id === u1.source_component_id)
      .map((port) => port.source_port_id),
  )
  const breakoutPoints = circuit.db.pcb_breakout_point
    .list()
    .filter(
      (point) =>
        point.source_port_id !== undefined &&
        u1PortIds.has(point.source_port_id),
    )

  expect(breakoutPoints).toHaveLength(2)
  const fanoutGroup = circuit.db.pcb_group.getWhere({ name: "U1_FANOUT" })!
  const fanoutBounds = {
    minX: fanoutGroup.center.x - fanoutGroup.width! / 2,
    maxX: fanoutGroup.center.x + fanoutGroup.width! / 2,
    minY: fanoutGroup.center.y - fanoutGroup.height! / 2,
    maxY: fanoutGroup.center.y + fanoutGroup.height! / 2,
  }
  const u1PcbPorts = circuit.db.pcb_port
    .list()
    .filter((port) => u1PortIds.has(port.source_port_id))
  expect(u1PcbPorts).toHaveLength(4)
  for (const port of u1PcbPorts) {
    expect(port.x).toBeWithin(fanoutBounds.minX, fanoutBounds.maxX)
    expect(port.y).toBeWithin(fanoutBounds.minY, fanoutBounds.maxY)
  }
  const localNetConnection = phases
    .flatMap((phase) => phase.startSimpleRouteJson?.connections ?? [])
    .find(
      (connection) =>
        connection.name ===
          `breakout-net:${fanoutGroup.pcb_group_id}:source_net_0` &&
        breakoutPoints.every((point) =>
          connection.pointsToConnect.some(
            (connectionPoint) =>
              connectionPoint.pointId === point.pcb_breakout_point_id,
          ),
        ),
    )
  expect(localNetConnection).toBeDefined()
  const planeFanoutInput = phases
    .map((phase) => phase.startSimpleRouteJson)
    .find((input) =>
      input?.buses?.some((bus) => bus.termination?.type === "plane"),
    )
  expect(
    planeFanoutInput?.buses?.some(
      (bus) =>
        bus.termination?.type === "plane" && bus.termination.layer === "inner1",
    ),
  ).toBeTrue()
  expect(
    circuit.db.pcb_via.list().some((via) => via.to_layer === "inner1"),
  ).toBeTrue()
  const globalConnection = phases
    .flatMap((phase) => phase.startSimpleRouteJson?.connections ?? [])
    .find(
      (connection) =>
        !connection.routingPcbGroupId &&
        breakoutPoints.every((point) =>
          connection.pointsToConnect.some(
            (connectionPoint) =>
              connectionPoint.pointId === point.pcb_breakout_point_id,
          ),
        ),
    )
  expect(globalConnection).toBeDefined()
  expect(
    globalConnection!.pointsToConnect.some((point) =>
      u1PcbPorts.some((port) => point.pointId === port.pcb_port_id),
    ),
  ).toBeFalse()

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(await runAllRoutingChecks(circuitJson)).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
