import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import "tests/fixtures/extend-expect-any-svg"

test("renders all ten NEMA 17 motor controller schematic sheets", async () => {
  const fixturePath = new URL(
    "./motor-controller.schematic.json.gz",
    import.meta.url,
  )
  const circuitJson: AnyCircuitElement[] = JSON.parse(
    gunzipSync(readFileSync(fixturePath)).toString("utf8"),
  )
  const sheets = circuitJson
    .filter((element) => element.type === "schematic_sheet")
    .map(({ name, sheet_index: sheetIndex, schematic_sheet_id: sheetId }) => {
      if (!name || sheetIndex === undefined) {
        throw new Error("Every NEMA 17 schematic sheet needs a name and index")
      }
      return { name, sheetIndex, sheetId }
    })
    .sort((a, b) => a.sheetIndex - b.sheetIndex)

  expect(sheets.map((sheet) => sheet.sheetIndex)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ])

  for (const { name, sheetIndex, sheetId } of sheets) {
    const number = String(sheetIndex).padStart(2, "0")
    const snapshotName = `${number}-${name.replaceAll("_", "-")}`
    const svg = convertCircuitJsonToSchematicSvg(circuitJson, {
      schematicSheetId: sheetId,
      width: 1600,
      height: 1100,
    })

    // The checked-in SVGs omit generated indentation on blank lines.
    await expect(svg.replace(/^[ \t]+$/gm, "")).toMatchSvgSnapshot(
      import.meta.path,
      snapshotName,
    )
  }
}, 60_000)
