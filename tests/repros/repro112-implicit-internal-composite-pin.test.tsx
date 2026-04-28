import { expect, test } from "bun:test"
import type { ConnectorProps } from "@tscircuit/props"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["pin1"],
} as const

const OneTerminalBatteryClip = (props: ConnectorProps) => (
  <connector
    pinLabels={pinLabels}
    manufacturerPartNumber="MY_18650_02"
    supplierPartNumbers={{
      jlcpcb: ["C2979182"],
    }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="8.499983mm"
          pcbY="0mm"
          width="4.99999mm"
          height="5.499989mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin1"]}
          pcbX="-8.499983mm"
          pcbY="0mm"
          width="4.99999mm"
          height="3.499993mm"
          shape="rect"
        />
        <platedhole
          portHints={["pin1"]}
          pcbX="-8.000111mm"
          pcbY="0mm"
          outerDiameter="1.8499836mm"
          holeDiameter="0.9249918mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin1"]}
          pcbX="7.999857mm"
          pcbY="0mm"
          outerDiameter="1.8499836mm"
          holeDiameter="0.9249918mm"
          shape="circle"
        />
      </footprint>
    }
    {...props}
  />
)

// skipped to fix timeouts in commit :f3e11cd84c7ad0e3c6e030145faca3b96840cecc
test.skip("repro111: separated contacts for one terminal become internally connected ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="70mm" height="25mm">
      <OneTerminalBatteryClip name="J_BAT_POS" pcbX={-20} pcbY={0} />
      <OneTerminalBatteryClip
        name="J_BAT_NEG"
        pcbX={20}
        pcbY={0}
        pcbRotation={180}
      />

      <resistor
        name="R_LOAD"
        resistance="10k"
        footprint="0603"
        pcbX={0}
        pcbY={6}
      />

      <trace from="J_BAT_POS.pin1" to="R_LOAD.pin1" />
      <trace from="R_LOAD.pin2" to="J_BAT_NEG.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const posSourceComponent = circuit.db.source_component.getWhere({
    name: "J_BAT_POS",
  })
  const posSourcePorts = circuit.db.source_port.list({
    source_component_id: posSourceComponent!.source_component_id,
  })
  const posPcbPorts = circuit.db.pcb_port
    .list()
    .filter((pcbPort) =>
      posSourcePorts.some(
        (sourcePort) => sourcePort.source_port_id === pcbPort.source_port_id,
      ),
    )
  const posInternalConnection = circuit.db.source_component_internal_connection
    .list()
    .find(
      (connection) =>
        connection.source_component_id ===
        posSourceComponent!.source_component_id,
    )

  expect(posSourcePorts).toHaveLength(2)
  expect(posPcbPorts).toHaveLength(2)
  for (const sourcePort of posSourcePorts) {
    expect(
      posPcbPorts.filter(
        (pcbPort) => pcbPort.source_port_id === sourcePort.source_port_id,
      ),
    ).toHaveLength(1)
  }
  expect(posInternalConnection?.source_port_ids.toSorted()).toEqual(
    posSourcePorts.map((port) => port.source_port_id).toSorted(),
  )
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)

  expect(
    convertCircuitJsonToPcbSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
