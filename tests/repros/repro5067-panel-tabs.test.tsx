import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tabs express their own manufacturing feature", async () => {
  const { circuit } = getTestFixture()
  let renderError: unknown
  try {
    circuit.add(
      createElement(
        "panel",
        {
          layoutMode: "grid",
          panelizationMethod: "tab-routing",
          tabLength: "3mm",
          tabCountPerEdge: 2,
        },
        <board name="B1" width="20mm" height="20mm" routingDisabled>
          <pcbnotetext text="2 tabs/edge; top keepout 0–7 mm" fontSize={0.6} />
        </board>,
        createElement("paneltabkeepout", {
          boardName: "B1",
          boardEdge: "top",
          from: "0mm",
          to: "7mm",
        }),
      ),
    )
    await circuit.renderUntilSettled()
  } catch (error) {
    renderError = error
  }
  let snapshotCircuit = circuit
  if (renderError) {
    // Failure produces no output. This is the actual input geometry, labelled as a reference.
    snapshotCircuit = getTestFixture().circuit
    snapshotCircuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board width="14mm" height="18mm" routingDisabled>
          <pcbnotetext
            text="INPUT REFERENCE / NO PANEL TABS OUTPUT"
            pcbY={2}
            fontSize={0.4}
          />
          <pcbnotetext
            text={String(renderError).split(". ")[0]}
            pcbY={-2}
            fontSize={0.35}
          />
        </board>
      </panel>,
    )
  }
  await expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    showPcbGroups: false,
  })
  expect(renderError).toBeUndefined()
  // Two tabs on each edge, except the first top tab whose span hits the keepout.
  expect(circuit.db.pcb_hole.list()).toHaveLength(14)
})
