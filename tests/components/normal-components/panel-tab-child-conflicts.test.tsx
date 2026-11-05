import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tab children reject conflicting modes and overlapping keepouts", async () => {
  for (const { count, method, offset, message } of [
    {
      count: 2,
      method: "tab-routing" as const,
      offset: 6,
      message: "Use either tabCountPerEdge",
    },
    {
      count: undefined,
      method: "none" as const,
      offset: 6,
      message: "require panelizationMethod",
    },
    {
      count: undefined,
      method: "tab-routing" as const,
      offset: 3,
      message: "overlaps a tab keepout",
    },
    {
      count: undefined,
      method: "tab-routing" as const,
      offset: 1,
      message: "extends beyond the board edge",
    },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <panel
        layoutMode="grid"
        tabLength="3mm"
        tabCountPerEdge={count}
        panelizationMethod={method}
      >
        <board name="B1" width="20mm" height="20mm" routingDisabled />
        <paneltab boardName="B1" edge="top" offset={offset} />
        <paneltabkeepout boardName="B1" edge="top" from="2mm" to="4mm" />
      </panel>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
  }
})
