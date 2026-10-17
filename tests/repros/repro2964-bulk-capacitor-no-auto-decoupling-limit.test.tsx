import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bulk and polarized power-to-ground capacitors do not silently receive 1mm decoupling trace limits unless decouplingFor is specified (#2964)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VCC",
          4: "GND",
        }}
        pinAttributes={{
          VCC: { requiresPower: true },
        }}
      />
      <capacitor
        name="C_DECAP"
        capacitance="100nF"
        footprint="0402"
        connections={{ pin1: "U1.VCC", pin2: "net.GND" }}
      />
      <capacitor
        name="C_BULK"
        capacitance="220uF"
        footprint="1210"
        connections={{ pin1: "U1.VCC", pin2: "net.GND" }}
      />
      <capacitor
        name="C_POLARIZED"
        capacitance="4.7uF"
        polarized
        footprint="0805"
        connections={{ pos: "U1.VCC", neg: "net.GND" }}
      />
      <capacitor
        name="C_EXPLICIT_BULK"
        capacitance="47uF"
        footprint="1210"
        decouplingFor=".U1 > .VCC"
        decouplingTo="net.GND"
      />
      <trace from=".U1 > .GND" to="net.GND" />
    </board>,
  )

  circuit.render()

  const getCap = (name: string) =>
    circuit.db.source_component
      .list()
      .find(
        (c): c is SourceSimpleCapacitor =>
          c.ftype === "simple_capacitor" && c.name === name,
      )

  expect(getCap("C_DECAP")?.max_decoupling_trace_length).toBe(1)
  expect(getCap("C_BULK")?.max_decoupling_trace_length).toBeUndefined()
  expect(getCap("C_POLARIZED")?.max_decoupling_trace_length).toBeUndefined()
  expect(getCap("C_EXPLICIT_BULK")?.max_decoupling_trace_length).toBe(1)
})
