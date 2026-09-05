import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import RP2040 from "./index"

test("rp2040 matches snapshots", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<RP2040 />)
  circuit.render()

  // Duplicate declarations without displayed labels must not create conflicts.
  const xinLabels = [
    ...circuit.db.schematic_net_label.list(),
    ...circuit.db.schematic_text.list(),
  ].filter((label) => label.text === "XIN")
  expect(xinLabels.length).toBeGreaterThan(0)
  expect(
    xinLabels.every((label) => label.display_superscript === undefined),
  ).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 20_000)
