import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("V-scoring rejects routed gaps, rounded boards and score lines crossing another board", async () => {
  const cases = [
    {
      props: { boardGap: "2mm" },
      boards: [<board key="B1" width="14mm" height="18mm" routingDisabled />],
      error: "boardGap={0}",
    },
    {
      props: {},
      boards: [
        <board
          key="B1"
          width="14mm"
          height="18mm"
          borderRadius="2mm"
          routingDisabled
        />,
      ],
      error: "rectangular board outlines",
    },
    {
      props: {},
      boards: [
        <board key="B1" width="14mm" height="18mm" routingDisabled />,
        <board key="B2" width="14mm" height="10mm" routingDisabled />,
      ],
      error: "interior of another board",
    },
  ]
  for (const { props, boards, error } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      createElement(
        "panel",
        {
          layoutMode: "grid",
          row: 1,
          col: boards.length,
          panelizationMethod: "v_score",
          ...props,
        },
        ...boards,
      ),
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
  }
})
