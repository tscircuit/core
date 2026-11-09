import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { AnyCircuitElement } from "circuit-json"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"
import { splitPointTouchingPourIslands } from "lib/utils/copper-pour-connectivity/split-point-touching-pour-islands"

test("RVboy cleanup removes point-attached pour islands without removing connected copper", async () => {
  const input = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL(
          "../fixtures/rvboy-point-touching-pours.json.gz",
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
  expect([...floatingPourIds].sort()).toEqual([
    "pcb_copper_pour_31_split0",
    "pcb_copper_pour_32_split0",
  ])
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
  expect(removedArea).toBeCloseTo(1.3161608966685227, 8)
  expect(findFloatingCopper(output).floatingPourIds.size).toBe(0)
  expect(input).toEqual(original)
  // Use the complete captured board for both checks and rendering. Only the
  // view is cropped: board-world mm, +X right and +Y up, inner2 copper.
  const render = (circuitJson: AnyCircuitElement[]) =>
    convertCircuitJsonToPcbSvg(circuitJson, {
      width: 1200,
      height: 450,
      layer: "inner2",
      hiddenLayerOpacity: 0,
      viewport: { minX: -22, maxX: -7, minY: 20.8, maxY: 23.3 },
    })
  await expect(render(input)).toMatchSvgSnapshot(
    import.meta.path,
    "rvboy-point-contact-before",
  )
  await expect(render(output)).toMatchSvgSnapshot(
    import.meta.path,
    "rvboy-point-contact-after",
  )
}, 30_000)
