import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel silkscreen express their own manufacturing feature", async () => {
  const { circuit } = getTestFixture()
  let renderError: unknown
  try {
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board name="B1" width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Panel silkscreen" fontSize={0.6} />
        </board>
        <silkscreentext text="PANEL A / REV 1" pcbY={12} fontSize={0.8} />
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
            text="INPUT REFERENCE / NO PANEL SILKSCREEN OUTPUT"
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
  expect(circuit.db.pcb_silkscreen_text.list()).toContainEqual(
    expect.objectContaining({
      text: "PANEL A / REV 1",
      anchor_position: { x: 0, y: 12 },
    }),
  )
})
