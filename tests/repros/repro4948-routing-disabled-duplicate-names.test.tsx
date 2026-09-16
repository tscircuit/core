import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routingDisabled preserves duplicate component name diagnostics", async () => {
  const diagnosticCounts = []

  for (const mode of [
    "routing_enabled",
    "platform_disabled",
    "board_disabled",
    "legacy_disabled",
  ]) {
    const { circuit } = getTestFixture({
      platform: { routingDisabled: mode === "platform_disabled" },
    })

    circuit.add(
      <board
        name="main"
        width="24mm"
        height="10mm"
        routingDisabled={mode === "board_disabled"}
        autorouter={mode === "legacy_disabled" ? "sequential-trace" : undefined}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          schX={-3}
        />
        <resistor
          name="R1"
          resistance="2k"
          footprint="0402"
          pcbX={3}
          schX={3}
        />
        <pcbnotetext
          text="Duplicate R1 names must be reported"
          pcbY={3}
          fontSize={0.6}
        />
        <pcbnotetext text={mode} pcbY={-3} fontSize={0.6} />
      </board>,
    )

    await circuit.renderUntilSettled()

    const duplicateNameErrors = circuit.db.pcb_trace_error
      .list()
      .filter((error) =>
        error.message.includes(
          'Multiple immediate children found with name "R1"',
        ),
      )
    diagnosticCounts.push({
      mode,
      duplicateNameErrors: duplicateNameErrors.length,
    })

    if (mode === "platform_disabled") {
      await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
        showErrorsInTextOverlay: true,
      })
    }
  }

  expect(diagnosticCounts).toEqual([
    { mode: "routing_enabled", duplicateNameErrors: 1 },
    { mode: "platform_disabled", duplicateNameErrors: 1 },
    { mode: "board_disabled", duplicateNameErrors: 1 },
    { mode: "legacy_disabled", duplicateNameErrors: 1 },
  ])
})
