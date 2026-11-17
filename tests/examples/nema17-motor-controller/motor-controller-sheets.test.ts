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
    .sort((a, b) => a.sheet_index - b.sheet_index)

  expect(sheets.map((sheet) => sheet.sheet_index)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ])

  for (const sheet of sheets) {
    const number = String(sheet.sheet_index).padStart(2, "0")
    const snapshotName = `${number}-${sheet.name.replaceAll("_", "-")}`
    const svg = convertCircuitJsonToSchematicSvg(circuitJson, {
      schematicSheetId: sheet.schematic_sheet_id,
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
