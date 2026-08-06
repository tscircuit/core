import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: direct chip power and ground traces do not infer a decoupling limit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin4: "GND",
        }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .VCC" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".U1 > .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const capacitor = circuit.db.source_component
    .list()
    .find(
      (component): component is SourceSimpleCapacitor =>
        component.ftype === "simple_capacitor" && component.name === "C1",
    )
  expect(capacitor?.max_decoupling_trace_length).toBeUndefined()

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

  expect(capacitorTraces).toHaveLength(2)
  expect(capacitorTraces.map((trace) => trace.max_length)).toEqual([
    undefined,
    undefined,
  ])
})
