import { expect, test } from "bun:test"
import { pcb_copper_pour, type AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reproduction only: whether unsupported pours should be preserved or rejected
// needs an import-contract decision. This assertion demonstrates preservation.
test("Circuit JSON subcircuit import retains an existing copper polygon", async () => {
  // Input points are in board-local mm: +X right, +Y top, +Z above,
  // right-handed. The import uses no translation, rotation, or layer flip.
  const pour = pcb_copper_pour.parse({
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "imported_pour",
    shape: "polygon",
    points: [
      { x: -3, y: -3 },
      { x: 3, y: -3 },
      { x: 3, y: 3 },
      { x: -3, y: 3 },
    ],
    layer: "top",
    source_net_id: "imported_ground",
    subcircuit_id: "imported_subcircuit",
    covered_with_solder_mask: true,
  })
  const input: AnyCircuitElement[] = [
    {
      type: "source_group",
      source_group_id: "imported_group",
      name: "Original",
      is_subcircuit: true,
      subcircuit_id: "imported_subcircuit",
    },
    {
      type: "source_net",
      source_net_id: "imported_ground",
      name: "GND",
      member_source_group_ids: ["imported_group"],
    },
    pour,
  ]
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20}>
      <subcircuit name="Imported" circuitJson={input} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const diagnostics = circuit
    .getCircuitJson()
    .filter((element) => /_(error|warning)$/.test(element.type))

  expect(diagnostics).toEqual([])
  expect(
    circuit.db.source_group.list().some((group) => group.name === "Original"),
  ).toBe(true)
  // Fails on current main: expected 1, received 0. No manual traces or
  // autorouting are needed to reproduce this import-only data loss.
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)
})
