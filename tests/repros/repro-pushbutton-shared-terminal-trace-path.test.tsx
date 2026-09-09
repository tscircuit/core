import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a trace through redundant switch pads retains its external connection", () => {
  const { circuit } = getTestFixture()
  let input: InputProblem | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      input = event.solverParams as InputProblem
    }
  })
  circuit.add(
    <board>
      <schematictext
        text="Pull-up to BOOT to switch to GND; path includes both signal pads"
        schY={2}
        fontSize={0.2}
      />
      <resistor name="R2" resistance="10k" footprint="0402" schX={-2} />
      <pushbutton
        name="SW1"
        pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "D" }}
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        footprint="smdpushbutton4_px6mm_py3.7mm_pw1mm_ph0.75mm"
      />
      <trace from="R2.pin1" to="net.VCC" />
      <trace name="BOOT" path={["R2.pin2", "SW1.pin2", "SW1.pin1"]} />
      <trace from="SW1.pin4" to="net.GND" />
      <trace from="SW1.pin3" to="SW1.pin4" />
    </board>,
  )
  circuit.render()
  const bootSourceTrace = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "BOOT")!
  expect(bootSourceTrace.connected_source_port_ids).toHaveLength(3)
  expect(input!.directConnections).toHaveLength(1)
  const [connection] = input!.directConnections
  expect(new Set(connection.pinIds).size).toBe(2)
  expect(
    circuit.db.schematic_text
      .list()
      .filter((text) => text.source_trace_id && text.text === "BOOT"),
  ).toHaveLength(1)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "BOOT"),
  ).toHaveLength(0)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "GND"),
  ).toHaveLength(1)
  expect(
    circuit.db.schematic_port.list().every((port) => port.is_connected),
  ).toBe(true)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
