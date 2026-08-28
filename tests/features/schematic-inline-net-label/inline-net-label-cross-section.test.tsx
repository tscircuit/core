import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named traces crossing schematic sections are eligible for inline label stubs", async () => {
  const { circuit } = getTestFixture()
  const solverInputProblems: InputProblem[] = []

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      solverInputProblems.push(event.solverParams as InputProblem)
    }
  })

  circuit.add(
    <board width={20} height={20} routingDisabled>
      <schematicsection name="left" displayName="Left" />
      <schematicsection name="right" displayName="Right" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schSectionName="left"
      />
      <chip
        name="U1"
        footprint="soic4"
        pinLabels={{ pin1: "SHARED" }}
        schPinArrangement={{ leftSide: ["SHARED"] }}
        schSectionName="right"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schSectionName="left"
      />
      <trace name="R1_SHARED" from=".R1 > .pin2" to=".U1 > .SHARED" />
      <trace name="SHARED_R2" from=".U1 > .SHARED" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Core owns the cross-section semantic decision. Each visible endpoint is a
  // distinct port-only connection that explicitly opts into solver placement.
  expect(
    solverInputProblems.flatMap((inputProblem) =>
      inputProblem.netConnections.filter((connection) =>
        ["R1_SHARED", "SHARED_R2"].includes(connection.netId),
      ),
    ),
  ).toEqual([
    expect.objectContaining({ netId: "R1_SHARED", allowInlineNetLabel: true }),
    expect.objectContaining({ netId: "R1_SHARED", allowInlineNetLabel: true }),
    expect.objectContaining({ netId: "SHARED_R2", allowInlineNetLabel: true }),
    expect.objectContaining({ netId: "SHARED_R2", allowInlineNetLabel: true }),
  ])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 20_000)
