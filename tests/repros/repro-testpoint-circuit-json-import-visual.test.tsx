import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestPointInflationFixture } from "tests/fixtures/get-testpoint-inflation-fixture"

const label = (text: string, color = "#1f2937") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="48"><rect width="600" height="48" fill="white"/><text x="12" y="30" font-family="sans-serif" font-size="17" fill="${color}">${text}</text></svg>`

test("show the AM3352 USB-C output probe Circuit JSON import result", async () => {
  const { original, imported, importError } =
    await getTestPointInflationFixture()
  expect(original.db.pcb_smtpad.list()).toHaveLength(3)
  expect(original.db.pcb_plated_hole.list()).toHaveLength(0)
  expect(original.db.source_trace.list()).toHaveLength(2)
  expect(original.db.pcb_trace.list()).toHaveLength(1)
  expect(
    original
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(importError?.message).toBe(
    'No inflator implemented for source component ftype: "simple_test_point"',
  )

  const originalJson = original.getCircuitJson()
  // The failed import has no board. Reuse only its empty board outline to
  // show the missing result beside the real source geometry.
  const importedJson = importError
    ? originalJson.filter((element) => element.type === "pcb_board")
    : imported.getCircuitJson()
  const options = { width: 600, height: 400 }
  const svg = stackSvgsHorizontally(
    [
      stackSvgsVertically([
        label("AM3352 USB-C output: C_PD_OUT (10 uF) + TP_5V"),
        convertCircuitJsonToPcbSvg(originalJson, options),
      ]),
      stackSvgsVertically([
        label(
          importError
            ? "Import failed: no simple_test_point inflator"
            : "Imported: testpoint and copper preserved",
          importError ? "#b91c1c" : "#166534",
        ),
        convertCircuitJsonToPcbSvg(importedJson, options),
      ]),
    ],
    { gap: 20 },
  )
  await expect(svg).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0,
  })
})
