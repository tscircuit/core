import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { AnyCircuitElement } from "circuit-json"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"
import { splitPointTouchingPourIslands } from "lib/utils/copper-pour-connectivity/split-point-touching-pour-islands"

test("RVboy cleanup separates a copper island enclosed by a self-touching hole", async () => {
  const input = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL(
          "../fixtures/rvboy-hole-enclosed-pour-island.json.gz",
          import.meta.url,
        ),
      ),
    ).toString(),
  ) as AnyCircuitElement[]
  const original = structuredClone(input)
  const split = input.flatMap((element): AnyCircuitElement[] =>
    element.type === "pcb_copper_pour" && element.shape === "brep"
      ? splitPointTouchingPourIslands(element.brep_shape).map(
          (brep_shape, index) => ({
            ...element,
            brep_shape,
            pcb_copper_pour_id: `${element.pcb_copper_pour_id}_split${index}`,
          }),
        )
      : [element],
  )
  const { floatingPourIds } = findFloatingCopper(split)
  const copperArea = (records: AnyCircuitElement[]) =>
    records
      .filter((element) => element.type === "pcb_copper_pour")
      .reduce((area, pour) => area + getPourPolygon(pour).area(), 0)
  expect(copperArea(split)).toBeCloseTo(copperArea(input), 6)
  expect([...floatingPourIds].sort()).toEqual(["pcb_copper_pour_0_split1"])
  const output = split.filter(
    (element) =>
      element.type !== "pcb_copper_pour" ||
      !floatingPourIds.has(element.pcb_copper_pour_id),
  )
  const removedArea = split
    .filter(
      (element) =>
        element.type === "pcb_copper_pour" &&
        floatingPourIds.has(element.pcb_copper_pour_id),
    )
    .reduce(
      (sum, element) =>
        sum +
        getPourPolygon(element as Parameters<typeof getPourPolygon>[0]).area(),
      0,
    )
  expect(removedArea).toBeCloseTo(0.024396323014499875, 8)
  expect(copperArea(output)).toBeCloseTo(copperArea(input) - removedArea, 6)
  expect(findFloatingCopper(output).floatingPourIds.size).toBe(0)
  expect(input).toEqual(original)
  // Use the complete captured board for both checks and rendering. Only the
  // view is cropped: board-world mm, +X right and +Y up, inner1 copper.
  const render = (circuitJson: AnyCircuitElement[]) =>
    convertCircuitJsonToPcbSvg(circuitJson, {
      width: 700,
      height: 900,
      layer: "inner1",
      hiddenLayerOpacity: 0,
      viewport: { minX: 22.8, maxX: 23.35, minY: 27.9, maxY: 28.65 },
    })
  await expect(render(input)).toMatchSvgSnapshot(
    import.meta.path,
    "rvboy-hole-island-before",
  )
  await expect(render(output)).toMatchSvgSnapshot(
    import.meta.path,
    "rvboy-hole-island-after",
  )
})
