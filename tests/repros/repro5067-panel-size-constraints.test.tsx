import { expect, test } from "bun:test"
import { panelProps } from "@tscircuit/props"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel dimensions are checked against manufacturing limits", async () => {
  const sizeLimits = { minWidth: "50mm", maxHeight: "25mm" }
  const { circuit } = getTestFixture()
  circuit.add(
    createElement(
      "panel",
      { layoutMode: "grid", ...sizeLimits },
      <board width="14mm" height="18mm" routingDisabled>
        <pcbnotetext
          text="Panel below min width / above max height"
          fontSize={0.5}
        />
        <pcbnotetext text="Reported violations" pcbY={-3} fontSize={0.5} />
      </board>,
    ),
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_panelization_placement_error.list()
  const pcb_note_text = circuit.db.pcb_note_text
    .list()
    .find((pcb_note_text) => pcb_note_text.text === "Reported violations")!
  circuit.db.pcb_note_text.update(pcb_note_text.pcb_note_text_id, {
    text: `Manufacturing limit diagnostics: ${errors.length}`,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
  expect(panelProps.parse(sizeLimits)).toMatchObject({
    minWidth: 50,
    maxHeight: 25,
  })
  expect(circuit.db.pcb_panel.list()[0]).toMatchObject({
    width: 24,
    height: 28,
  })
  expect(errors.map((error) => error.message).join("\n")).toContain(
    "minimum width",
  )
  expect(errors.map((error) => error.message).join("\n")).toContain(
    "maximum height",
  )
})
