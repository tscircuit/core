import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("tab controls cannot create slots narrower than the configured router width", async () => {
  for (const tabPlacement of [
    { countPerEdge: 4 },
    {
      positions: [
        { edge: "top", offset: 4 },
        { edge: "top", offset: 8 },
      ],
    },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      createElement(
        "panel",
        {
          layoutMode: "grid",
          panelizationMethod: "tab-routing",
          tabLength: "3mm",
          tabWidth: "2mm",
          tabPlacement,
        },
        <board width="20mm" height="20mm" routingDisabled />,
      ),
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      "router clearance",
    )
  }
})
