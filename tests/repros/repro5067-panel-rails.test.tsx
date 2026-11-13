import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderCircuitJsonOrError } from "tests/fixtures/render-circuit-json-or-error"

test("a tooling rail sits in the panel edge padding", async () => {
  const circuitJson = await renderCircuitJsonOrError(
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

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    showPcbGroups: true,
  })
  expect(
    circuitJson.flatMap((element) =>
      element.type === "pcb_group" && element.name === "LEFT_RAIL"
        ? [
            {
              center: element.center,
              width: element.width,
              height: element.height,
            },
          ]
        : [],
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": -9.5,
          "y": 0,
        },
        "height": 28,
        "width": 5,
      },
    ]
  `)
})
