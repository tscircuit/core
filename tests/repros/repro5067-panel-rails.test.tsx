import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel rails express their own manufacturing feature", async () => {
  const { circuit } = getTestFixture()
  let renderError: unknown
  try {
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board name="B1" width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Panel rails" fontSize={0.6} />
        </board>
        {createElement(
          "toolingrail",
          { name: "LEFT_RAIL", panelSide: "left", width: "5mm" },
          <pcbnotetext text="LEFT RAIL" pcbRotation={90} fontSize={0.6} />,
        )}
      </panel>,
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
            text="INPUT REFERENCE / NO PANEL RAILS OUTPUT"
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
    showPcbGroups: true,
  })
  expect(renderError).toBeUndefined()
  const rail = circuit.db.pcb_group
    .list()
    .find((group) => group.name === "LEFT_RAIL")
  expect(rail).toMatchObject({
    center: { x: -9.5, y: 0 },
    width: 5,
    height: 28,
  })
})
