import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four-pin crystal routing constraints only apply to signal pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="20mm">
      <net name="GND" isGroundNet />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="10pF"
        pinVariant="four_pin"
        pcbX={0}
        pcbY={0}
        footprint="crystal"
      />
      <capacitor
        name="C_XIN"
        capacitance="10pF"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <capacitor
        name="C_XOUT"
        capacitance="10pF"
        footprint="0402"
        pcbX={5}
        pcbY={0}
      />
      <resistor
        name="R_GND"
        resistance="1k"
        footprint="0402"
        pcbX={20}
        pcbY={0}
      />
      <trace from=".Y1 > .X1" to=".C_XIN > .pin1" />
      <trace from=".Y1 > .X2" to=".C_XOUT > .pin1" />
      <trace from=".Y1 > .pin2" to="net.GND" />
      <trace from=".Y1 > .pin4" to="net.GND" />
      <trace from=".R_GND > .pin1" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    Object.fromEntries(
      circuit.db.source_trace
        .list()
        .map((trace) => [trace.display_name, trace.max_length]),
    ),
  ).toEqual({
    ".Y1 > .X1 to .C_XIN > .pin1": 10,
    ".Y1 > .X2 to .C_XOUT > .pin1": 10,
    ".Y1 > .pin2 to net.GND": undefined,
    ".Y1 > .pin4 to net.GND": undefined,
    ".R_GND > .pin1 to net.GND": undefined,
  })

  expect(
    Object.fromEntries(
      circuit.db.source_trace
        .list()
        .map((trace) => [trace.display_name, trace.max_via_count]),
    ),
  ).toEqual({
    ".Y1 > .X1 to .C_XIN > .pin1": 0,
    ".Y1 > .X2 to .C_XOUT > .pin1": 0,
    ".Y1 > .pin2 to net.GND": undefined,
    ".Y1 > .pin4 to net.GND": undefined,
    ".R_GND > .pin1 to net.GND": undefined,
  })

  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
})
