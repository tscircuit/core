import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("infers a 1mm decoupling limit from direct VCC and ground traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin4: "GND" }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .VCC" to=".C1 > .1" />
      <trace from=".C1 > .1" to="net.VCC" />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".U1 > .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const capacitor = getSourceCapacitor(circuit, "C1")
  expect(capacitor?.max_decoupling_trace_length).toBe(1)

  const capacitorPortIds = new Set(
    circuit.db.source_port
      .list()
      .filter(
        (port) => port.source_component_id === capacitor?.source_component_id,
      )
      .map((port) => port.source_port_id),
  )
  const capacitorTraces = circuit.db.source_trace
    .list()
    .filter((trace) =>
      trace.connected_source_port_ids.some((portId) =>
        capacitorPortIds.has(portId),
      ),
    )

  expect(capacitorTraces).toHaveLength(3)
  expect(capacitorTraces.every((trace) => trace.max_length === 1)).toBe(true)
  expect(
    capacitorTraces.some(
      (trace) =>
        trace.connected_source_port_ids.length === 2 &&
        trace.connected_source_net_ids.length === 0,
    ),
  ).toBe(true)
  expect(
    capacitorTraces.some(
      (trace) =>
        trace.connected_source_port_ids.length === 1 &&
        trace.connected_source_net_ids.length === 1,
    ),
  ).toBe(true)
})
