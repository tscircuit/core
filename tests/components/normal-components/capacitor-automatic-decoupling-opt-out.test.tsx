import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shouldHaveDecouplingCapacitor false opts a power pin out of automatic detection", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VBAT",
          4: "GND",
        }}
        pinAttributes={{
          VBAT: {
            requiresPower: true,
            shouldHaveDecouplingCapacitor: false,
          },
        }}
      />
      <capacitor name="C1" capacitance="100uF" footprint="1210" />
      <trace from=".U1 > .VBAT" to=".C1 > .1" />
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

  expect(capacitorSourceComponent?.max_decoupling_trace_length).toBeUndefined()
})
