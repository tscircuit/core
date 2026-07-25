import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro119", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX="-3.69"
        schY="1.7"
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX="-6.19"
        schY="0.3"
        connections={{ pin1: "R1.pin1" }}
      />
      <chip
        footprint="soic8"
        name="U1"
        connections={{ pin1: "C1.pin2", pin2: "R1.pin2" }}
      />
      <chip
        footprint="soic8"
        name="U2"
        schX="-2.92"
        schY="-0.4"
        connections={{ pin1: "U1.pin3", pin2: "U1.pin4" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u2Pin1Trace = circuit.db.source_trace
    .list()
    .find((trace) => trace.display_name === ".U2 > .pin1 to U1.pin3")
  expect(u2Pin1Trace).toBeDefined()

  const hasExcessiveU2Pin1Detour = circuit.db.schematic_trace
    .list()
    .some(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        u2Pin1Trace?.subcircuit_connectivity_map_key,
    )

  expect(hasExcessiveU2Pin1Detour).toBe(false)

  circuit.on("debug:logOutput", (e) => {
    if (e.name === "group-trace-render-input-problem") {
      console.log(e.content)
    }
  })

  const schematicNetLabels = circuit.db.schematic_net_label.list()
  const fallbackLabels = [
    ...new Set(schematicNetLabels.map((label) => label.text)),
  ].sort()

  expect(fallbackLabels).toEqual(["U1_pin2", "U1_pin3", "U1_pin4"])
  expect(
    schematicNetLabels.filter(
      (label) =>
        label.source_net_id === u2Pin1Trace?.subcircuit_connectivity_map_key,
    ),
  ).toHaveLength(2)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
