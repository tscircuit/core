import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const OnePinPad = ({
  name,
  pcbX,
  pcbY,
}: {
  name: string
  pcbX: number
  pcbY: number
}) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    footprint={
      <footprint>
        <smtpad portHints={["pin1"]} shape="circle" radius="0.35mm" />
      </footprint>
    }
  />
)

test.failing(
  "plane fanouts carry connectivity into a later net routing phase",
  async () => {
    const { circuit } = getTestFixture()
    const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

    circuit.add(
      <board
        width="14mm"
        height="10mm"
        layers={4}
        minTraceWidth="0.15mm"
        defaultTraceWidth="0.15mm"
        minTraceToPadEdgeClearance="0.15mm"
        minViaEdgeToPadEdgeClearance="0.15mm"
        minViaHoleDiameter="0.2mm"
        minViaPadDiameter="0.5mm"
      >
        <autoroutingphase
          name="V3V3_PLANE_FANOUT"
          phaseIndex={0}
          autorouter="fanout"
          fanoutPourNetMap={{ inner1: "V3V3" }}
        />
        <autoroutingphase
          name="LOCAL_BRANCHES"
          phaseIndex={1}
          autorouter="beta_pipeline9"
        />
        <autoroutingphase
          name="V3V3_NET"
          phaseIndex={2}
          autorouter="beta_pipeline9"
        />

        <net name="V3V3" isPowerNet routingPhaseIndex={2} />
        <copperpour layer="inner1" connectsTo="net.V3V3" />

        <OnePinPad name="U1" pcbX={-4} pcbY={-1.5} />
        <OnePinPad name="C1" pcbX={-4} pcbY={1.5} />
        <OnePinPad name="U2" pcbX={4} pcbY={-1.5} />
        <OnePinPad name="C2" pcbX={4} pcbY={1.5} />

        <trace
          name="U1_V3V3_PLANE"
          from=".U1 > .pin1"
          to="net.V3V3"
          routingPhaseIndex={0}
        />
        <trace
          name="U2_V3V3_PLANE"
          from=".U2 > .pin1"
          to="net.V3V3"
          routingPhaseIndex={0}
        />
        <trace
          name="U1_LOCAL_BRANCH"
          from=".U1 > .pin1"
          to=".C1 > .pin1"
          routingPhaseIndex={1}
        />
        <trace
          name="U2_LOCAL_BRANCH"
          from=".U2 > .pin1"
          to=".C2 > .pin1"
          routingPhaseIndex={1}
        />

        <pcbnotetext
          pcbY={4.25}
          fontSize="0.35mm"
          text="V3V3 branches already meet on inner1"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(autoroutingPhaseIoStack).toHaveLength(3)
    expect(
      autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.connections.map(
        (connection) => connection.pointsToConnect.length,
      ),
    ).toEqual([1, 1])
    expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(
      2,
    )
    expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson?.traces).toHaveLength(
      4,
    )

    const v3v3SourceNet = circuit.db.source_net.getWhere({ name: "V3V3" })!
    const finalPhase = autoroutingPhaseIoStack[2]!
    const finalNetConnection =
      finalPhase.startSimpleRouteJson!.connections.find(
        (connection) => connection.name === v3v3SourceNet.source_net_id,
      )!
    const getPcbPortId = (sourceComponentName: string) => {
      const sourceComponent = circuit.db.source_component.getWhere({
        name: sourceComponentName,
      })!
      const sourcePort = circuit.db.source_port.getWhere({
        source_component_id: sourceComponent.source_component_id,
        name: "pin1",
      })!
      return circuit.db.pcb_port.getWhere({
        source_port_id: sourcePort.source_port_id,
      })!.pcb_port_id
    }
    const planeTerminatedPcbPortIds = [getPcbPortId("U1"), getPcbPortId("U2")]

    expect(
      finalNetConnection.pointsToConnect.map((point) => point.pointId),
    ).toEqual(expect.arrayContaining(planeTerminatedPcbPortIds))

    await expect(
      autoroutingPhaseIoStack,
    ).toMatchAutoroutingPhaseIoStackSnapshot(
      import.meta.path,
      "repro-phased-plane-connectivity",
      circuit,
    )

    // Both U1 and U2 already reach the same V3V3 plane in phase 0. The final
    // net phase should receive that connectivity and leave the two routed local
    // branches alone. It currently receives no external group and adds a fifth,
    // redundant PCB trace between the branches.
    expect(finalNetConnection.externallyConnectedPointIds).toEqual([
      planeTerminatedPcbPortIds,
    ])
    expect(finalPhase.endSimpleRouteJson?.traces).toHaveLength(
      finalPhase.startSimpleRouteJson?.traces?.length ?? 0,
    )
  },
)
