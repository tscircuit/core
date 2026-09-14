import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("default fanout creates shared-signal exits and keeps plane nets local", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="24mm"
      height="16mm"
      layers={4}
      autorouter="default"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
      isViaInPadAllowed
    >
      <copperpour layer="inner1" connectsTo="net.GND" />
      <net name="SHARED" />
      <fanout
        name="U1_FANOUT"
        pcbX={-3}
        width="8mm"
        height="8mm"
        fanoutRoutingLayers={["top", "bottom"]}
        fanoutPourNetMap={{ inner1: "GND" }}
      >
        <chip
          name="U1"
          noSchematicRepresentation
          noConnect={["TXP", "TXN"]}
          pinLabels={{
            pin1: "GND1",
            pin2: "GND2",
            pin3: "TXP",
            pin4: "TXN",
            pin5: "GND",
          }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={-0.7}
                pcbY={-0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={0.7}
                pcbY={-0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin3"]}
                pcbX={-0.7}
                pcbY={0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin4"]}
                pcbX={0.7}
                pcbY={0.7}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin5"]}
                pcbX={0}
                pcbY={0}
                width="0.4mm"
                height="0.4mm"
                shape="rect"
              />
            </footprint>
          }
        />
        <trace name="U1_SHARED1" from=".U1 > .GND1" to="net.SHARED" />
        <trace name="U1_SHARED2" from=".U1 > .GND2" to="net.SHARED" />
        <trace name="U1_GND" from=".U1 > .GND" to="net.GND" />
      </fanout>

      <resistor name="R1" resistance="50" footprint="0402" pcbX={6} pcbY={2} />
      <resistor name="R2" resistance="50" footprint="0402" pcbX={6} pcbY={-2} />
      <trace name="R1_GND" from="R1.pin2" to="net.GND" />
      <trace name="R2_GND" from="R2.pin2" to="net.GND" />
      <trace name="R1_SHARED" from="R1.pin1" to="net.SHARED" />
      <trace name="R2_SHARED" from="R2.pin1" to="net.SHARED" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1 = circuit.db.source_component.getWhere({ name: "U1" })!
  const sharedPortIds = new Set(
    circuit.db.source_port
      .list()
      .filter(
        (port) =>
          port.source_component_id === u1.source_component_id &&
          (port.name === "GND1" || port.name === "GND2"),
      )
      .map((port) => port.source_port_id),
  )
  const sharedBreakoutPoints = circuit.db.pcb_breakout_point
    .list()
    .filter(
      (point) =>
        point.source_port_id !== undefined &&
        sharedPortIds.has(point.source_port_id),
    )

  expect(sharedBreakoutPoints).toHaveLength(2)
  const globalSharedConnection = phases
    .flatMap((phase) => phase.startSimpleRouteJson?.connections ?? [])
    .find(
      (connection) =>
        !connection.routingPcbGroupId &&
        sharedBreakoutPoints.every((point) =>
          connection.pointsToConnect.some(
            (connectionPoint) =>
              connectionPoint.pointId === point.pcb_breakout_point_id,
          ),
        ),
    )
  expect(globalSharedConnection).toBeDefined()

  const groundPort = circuit.db.source_port.getWhere({
    source_component_id: u1.source_component_id,
    name: "GND",
  })!
  expect(
    circuit.db.pcb_breakout_point.getWhere({
      source_port_id: groundPort.source_port_id,
    }),
  ).toBeUndefined()
  expect(
    circuit.db.pcb_via.list().some((via) => via.to_layer === "inner1"),
  ).toBe(true)

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(await runAllRoutingChecks(circuitJson)).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
