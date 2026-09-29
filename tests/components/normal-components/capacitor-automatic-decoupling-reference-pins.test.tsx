import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reference and bias pins do not infer power decoupling limits", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VIN",
          pin2: "VREG",
          pin3: "VCM",
          pin4: "GND",
          pin5: "VOUT",
        }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <capacitor name="C2" capacitance="100nF" footprint="0402" />
      <capacitor name="C3" capacitance="1uF" footprint="0402" />
      <capacitor name="C4" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .VIN" to=".C1 > .pin1" />
      <trace from=".U1 > .VREG" to=".C2 > .pin1" />
      <trace from=".U1 > .VCM" to=".C3 > .pin1" />
      <trace from=".U1 > .VOUT" to=".C4 > .pin1" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".C2 > .pin2" to="net.GND" />
      <trace from=".C3 > .pin2" to="net.GND" />
      <trace from=".C4 > .pin2" to="net.GND" />
    </board>,
  )

  circuit.render()

  const maxLengths = Object.fromEntries(
    circuit.db.source_component
      .list()
      .filter(
        (sourceComponent): sourceComponent is SourceSimpleCapacitor =>
          sourceComponent.ftype === "simple_capacitor",
      )
      .map((capacitor) => [
        capacitor.name,
        capacitor.max_decoupling_trace_length,
      ]),
  )

  expect(maxLengths).toEqual({
    C1: 1,
    C2: undefined,
    C3: undefined,
    C4: undefined,
  })
})
