import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor connected to a chip power pin through a shared net gets trace limits", () => {
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
      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".C1 > .1" to="net.VCC" />
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
  const sourceTraceMaxLengths = Object.fromEntries(
    circuit.db.source_trace
      .list()
      .map((sourceTrace) => [sourceTrace.display_name, sourceTrace.max_length]),
  )

  expect(capacitorSourceComponent?.max_decoupling_trace_length).toBe(1)
  expect(sourceTraceMaxLengths).toEqual({
    ".U1 > .VCC to net.VCC": undefined,
    ".C1 > .1 to net.VCC": 1,
    ".C1 > .2 to net.GND": 1,
    ".U1 > .GND to net.GND": undefined,
  })
})
