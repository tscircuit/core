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
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0}>
        <schematicsection name="left" displayName="Left" />
        <schematicsection name="right" displayName="Right" />
      </schematicsheet>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schSheetName="Sheet A"
        schSectionName="left"
      />
      <chip
        name="U1"
        footprint="soic4"
        pinLabels={{ pin1: "SHARED" }}
        schPinArrangement={{ leftSide: ["SHARED"] }}
        schSheetName="Sheet A"
        schSectionName="right"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schSheetName="Sheet A"
        schSectionName="left"
      />
      <trace name="R1_SHARED" from=".R1 > .pin2" to=".U1 > .SHARED" />
      <trace name="SHARED_R2" from=".U1 > .SHARED" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Core owns the cross-section semantic decision. Each visible endpoint is a
  // distinct port-only connection that explicitly opts into solver placement.
  const crossSectionConnections = solverInputProblems.flatMap((inputProblem) =>
    inputProblem.netConnections.filter(
      (connection) => connection.netId === "R1_SHARED",
    ),
  )
  expect(crossSectionConnections).toHaveLength(1)
  expect(crossSectionConnections[0]).toEqual(
    expect.objectContaining({
      netId: "R1_SHARED",
      allowInlineNetLabel: true,
    }),
  )
  expect(crossSectionConnections[0]?.pinIds).toHaveLength(3)
  expect(
    solverInputProblems.some((inputProblem) =>
      inputProblem.netConnections.some(
        (connection) => connection.netId === "SHARED_R2",
      ),
    ),
  ).toBe(false)

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter(
      (text) => text.text === "R1_SHARED" && text.source_trace_id !== undefined,
    )
  expect(inlineLabels).toHaveLength(2)
  expect(
    new Set(inlineLabels.map((text) => text.schematic_sheet_id)).size,
  ).toBe(1)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "R1_SHARED"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 20_000)
