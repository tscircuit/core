import { expect, test } from "bun:test"
import { renderCircuitJsonOrError } from "tests/fixtures/render-circuit-json-or-error"

test("panel silkscreen text can be placed in the panel frame", async () => {
  const circuitJson = await renderCircuitJsonOrError(
    <panel layoutMode="grid" edgePadding="5mm">
      <board name="B1" width="14mm" height="18mm" routingDisabled>
        <pcbnotetext text="Panel silkscreen" fontSize={0.6} />
      </board>
      <silkscreentext text="PANEL A / REV 1" pcbY={12} fontSize={0.8} />
    </panel>,
  )

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
  expect(
    circuitJson.flatMap((element) =>
      element.type === "pcb_silkscreen_text" ? [element.text] : [],
    ),
  ).toMatchInlineSnapshot(`[]`)
})
