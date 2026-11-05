import { expect, test } from "bun:test"
import { panelProps } from "@tscircuit/props"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tab counts and keepouts preserve explicit manufacturing intent", async () => {
  const tabKeepouts = [{ edge: "top", from: 0, to: 7 }]
  const { circuit } = getTestFixture()
  circuit.add(
    createElement(
      "panel",
      {
        layoutMode: "grid",
        panelizationMethod: "tab-routing",
        tabLength: "3mm",
        tabCountPerEdge: 2,
        tabKeepouts,
      },
      <board width="20mm" height="20mm" routingDisabled>
        <pcbnotetext text="2 tabs/edge; top keepout 0–7 mm" fontSize={0.6} />
      </board>,
    ),
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(panelProps.parse({ tabCountPerEdge: 2, tabKeepouts })).toMatchObject({
    tabCountPerEdge: 2,
    tabKeepouts,
  })
  // Two per edge except the first top tab, whose full span overlaps the keepout.
  const holes = circuit.db.pcb_hole.list()
  expect(holes.length).toBeGreaterThan(8)
})
