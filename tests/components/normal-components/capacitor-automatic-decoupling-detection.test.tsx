import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic decoupling preserves existing trace limits", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VCC",
          4: "GND",
        }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .VCC" to=".C1 > .1" maxLength={5} />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".U1 > .GND" to="net.GND" />
    </board>,
  )

  circuit.render()

  const capacitorSourceComponent = circuit.db.source_component
    .list()
    .find(
      (sourceComponent): sourceComponent is SourceSimpleCapacitor =>
        sourceComponent.ftype === "simple_capacitor" &&
        sourceComponent.name === "C1",
    )
  const capacitorSourcePortIds = new Set(
    circuit.db.source_port
      .list()
      .filter(
        (sourcePort) =>
          sourcePort.source_component_id ===
          capacitorSourceComponent?.source_component_id,
      )
      .map((sourcePort) => sourcePort.source_port_id),
  )
  const capacitorSourceTraces = circuit.db.source_trace
    .list()
    .filter((sourceTrace) =>
      sourceTrace.connected_source_port_ids.some((sourcePortId) =>
        capacitorSourcePortIds.has(sourcePortId),
      ),
    )

  expect(capacitorSourceComponent?.max_decoupling_trace_length).toBe(1)
  expect(
    capacitorSourceTraces.map((sourceTrace) => sourceTrace.max_length),
  ).toEqual([5, 1])
})
