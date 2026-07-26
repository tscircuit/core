import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro119", async () => {
  const { circuit } = getTestFixture()
  let solverInputProblem: InputProblem | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      solverInputProblem = event.solverParams as InputProblem
    }
  })

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

  const fallbackLabels = [
    ...new Set(
      circuit.db.schematic_net_label.list().map((label) => label.text),
    ),
  ].sort()

  expect(fallbackLabels).toEqual(["U1_pin2", "U1_pin4"])
  expect(
    solverInputProblem?.directConnections.find(
      (connection) => connection.netId === ".U2 > .pin2 to U1.pin4",
    )?.netLabelWidth,
  ).toBe(0.96)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
