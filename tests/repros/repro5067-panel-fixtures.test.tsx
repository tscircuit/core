import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel fixtures express their own manufacturing feature", async () => {
  const { circuit } = getTestFixture()
  let renderError: unknown
  try {
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board name="B1" width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Panel fixtures" fontSize={0.6} />
        </board>
        <hole diameter="3mm" pcbX={-9.5} pcbY={-6} />
        <fiducial name="F1" padDiameter="1mm" pcbX={9.5} pcbY={6} />
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
            text="INPUT REFERENCE / NO PANEL FIXTURES OUTPUT"
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
  })
  expect(renderError).toBeUndefined()
  expect(circuit.db.pcb_hole.list()).toHaveLength(1)
  expect(circuit.db.pcb_hole.list()[0]).toMatchObject({
    x: -9.5,
    y: -6,
    hole_diameter: 3,
  })
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(1)
  expect(circuit.db.pcb_smtpad.list()[0]).toMatchObject({
    x: 9.5,
    y: 6,
    shape: "circle",
    radius: 0.5,
  })
})
