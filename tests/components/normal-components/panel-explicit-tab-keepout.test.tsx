import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit tab positions cannot silently cross keepouts or leave a board edge", async () => {
  for (const { offset, error } of [
    { offset: "3mm", error: "overlaps a tab keepout" },
    { offset: "1mm", error: "extends beyond the board edge" },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      createElement(
        "panel",
        {
          layoutMode: "grid",
          panelizationMethod: "tab-routing",
          tabLength: "3mm",
          tabPlacement: {
            positions: [{ boardName: "B1", edge: "top", offset }],
            keepouts: [
              { boardName: "B1", edge: "top", from: "2mm", to: "4mm" },
            ],
          },
        },
        <board name="B1" width="20mm" height="20mm" routingDisabled />,
      ),
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
  }
})
