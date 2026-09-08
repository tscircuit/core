import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("redundant pin-to-pin traces do not hide a pushbutton's ground connection", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <schematictext
        text="SW1: BOOT on the left, GND on the right; redundant pad traces"
        fontSize={0.2}
        schY={2}
      />
      <pushbutton
        name="SW1"
        pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "D" }}
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        footprint="smdpushbutton4_px6mm_py3.7mm_pw1mm_ph0.75mm"
      />
      <trace from="SW1.pin1" to="net.BOOT" />
      <trace from="SW1.pin3" to="net.GND" />
      <trace from="SW1.pin2" to="SW1.pin1" />
      <trace from="SW1.pin4" to="SW1.pin3" />
    </board>,
  )
  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(4)
  expect(
    circuit.db.schematic_net_label
      .list()
      .map((label) => label.text)
      .sort(),
  ).toEqual(["BOOT", "GND"])
  // Each displayed terminal must have a visible wire, not just a zero-length
  // connection between two physical pads occupying that terminal.
  for (const pinNumber of [1, 3]) {
    const port = circuit.db.schematic_port
      .list()
      .find((port) => port.pin_number === pinNumber)!
    expect(
      circuit.db.schematic_trace
        .list()
        .some((trace) =>
          trace.edges.some(
            ({ from, to }) =>
              (from.x !== to.x || from.y !== to.y) &&
              ((from.x === port.center.x && from.y === port.center.y) ||
                (to.x === port.center.x && to.y === port.center.y)),
          ),
        ),
    ).toBe(true)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
