import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel rails and manufacturing fixtures are available outside child boards", async () => {
  const { circuit } = getTestFixture()
  let renderError: unknown
  try {
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board width="14mm" height="18mm" routingDisabled>
          <resistor name="R1" resistance="1k" footprint="0402" />
        </board>
        {createElement(
          "toolingrail",
          { name: "LEFT_RAIL", side: "left", width: "5mm" },
          <hole diameter="3mm" pcbY={-6} />,
          <fiducial name="F1" padDiameter="1mm" pcbY={6} />,
        )}
        {createElement(
          "toolingrail",
          { name: "RIGHT_RAIL", side: "right", width: "5mm" },
          <hole diameter="3mm" pcbY={-6} />,
          <fiducial name="F2" padDiameter="1mm" pcbY={6} />,
        )}
        <hole diameter="2mm" pcbY={-12} />
        <silkscreentext text="PANEL A / REV 1" pcbY={12} fontSize={0.8} />
      </panel>,
    )
    await circuit.renderUntilSettled()
  } catch (error) {
    renderError = error
  }

  let snapshotCircuit = circuit
  if (renderError) {
    // No manufacturing output exists on failure. Show the real input board
    // separately and label it as a reference, rather than implying success.
    snapshotCircuit = getTestFixture().circuit
    snapshotCircuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board width="14mm" height="18mm" routingDisabled>
          <resistor name="R1" resistance="1k" footprint="0402" />
          <pcbnotetext
            text="INPUT REFERENCE / NO PANEL OUTPUT"
            pcbY={4}
            fontSize={0.5}
          />
          <pcbnotetext
            text={String(renderError).split(". ")[0]}
            pcbY={-4}
            fontSize={0.4}
          />
        </board>
      </panel>,
    )
  }
  await expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
  expect(renderError).toBeUndefined()
  expect(circuit.db.pcb_hole.list()).toHaveLength(3)
  expect(
    circuit.db.pcb_smtpad.list().filter((pad) => pad.shape === "circle"),
  ).toHaveLength(2)
  expect(
    circuit.db.pcb_silkscreen_text
      .list()
      .some((text) => text.text === "PANEL A / REV 1"),
  ).toBe(true)
})
