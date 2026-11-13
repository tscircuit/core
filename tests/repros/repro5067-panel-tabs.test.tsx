import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderCircuitJsonOrError } from "tests/fixtures/render-circuit-json-or-error"

test("panel tab count and keepouts control where tabs are placed", async () => {
  const circuitJson = await renderCircuitJsonOrError(
    <panel
      layoutMode="grid"
      panelizationMethod="tab-routing"
      tabLength="3mm"
      tabCountPerEdge={2}
    >
      <board name="B1" width="20mm" height="20mm" routingDisabled>
        <pcbnotetext text="2 tabs/edge; top keepout 0–7 mm" fontSize={0.6} />
      </board>
      {createElement("paneltabkeepout", {
        boardName: "B1",
        boardEdge: "top",
        from: "0mm",
        to: "7mm",
      })}
    </panel>,
  )

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    showPcbGroups: false,
  })
  // Mouse-bite holes: 2 per tab, for 2 tabs on each of 4 edges minus the
  // top tab inside the keepout.
  expect(
    circuitJson.filter((element) => element.type === "pcb_hole").length,
  ).toMatchInlineSnapshot(`14`)
})
