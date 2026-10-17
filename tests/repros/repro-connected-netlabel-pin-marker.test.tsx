import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

circuit.add(
  <board width={25} height={10} routingDisabled schMaxTraceDistance={1}>
    <schematictext
      text="C5 GND has no schematic trace; U1 has connected and open pins"
      schX={0}
      schY={2}
      fontSize={0.2}
    />
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0603"
      schX={-5}
      schY={0}
      schRotation={270}
      connections={{ pin2: "net.GND" }}
    />
    <chip
      name="U1"
      footprint="soic4"
      schX={5}
      schY={0}
      pinLabels={{ pin1: "GND", pin2: "SIGNAL", pin3: "OPEN", pin4: "NC" }}
      connections={{ GND: "net.GND", SIGNAL: "net.SIGNAL" }}
    />
  </board>,
)

beforeAll(async () => {
  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(3)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "GND"),
  ).toHaveLength(2)
  const capacitor = circuit.db.source_component.getWhere({ name: "C5" })!
  const capacitorGroundSourcePort = circuit.db.source_port.getWhere({
    source_component_id: capacitor.source_component_id,
    name: "pin2",
  })!
  const capacitorGroundSourceTrace = circuit.db.source_trace
    .list()
    .find((trace) =>
      trace.connected_source_port_ids.includes(
        capacitorGroundSourcePort.source_port_id,
      ),
    )!
  expect(capacitorGroundSourceTrace).toBeDefined()
  expect(
    circuit.db.schematic_trace
      .list()
      .filter(
        (trace) =>
          trace.source_trace_id === capacitorGroundSourceTrace.source_trace_id,
      ),
  ).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test.failing("a directly labeled GND pin should be marked connected", () => {
  const capacitor = circuit.db.source_component.getWhere({ name: "C5" })!
  const capacitorGroundSourcePort = circuit.db.source_port.getWhere({
    source_component_id: capacitor.source_component_id,
    name: "pin2",
  })!
  const capacitorGroundPort = circuit.db.schematic_port.getWhere({
    source_port_id: capacitorGroundSourcePort.source_port_id,
  })!
  expect(capacitorGroundPort.is_connected).toBe(true)
})
