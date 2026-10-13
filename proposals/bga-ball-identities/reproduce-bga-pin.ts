import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
if (!process.argv[2])
  throw new Error("Usage: bun reproduce-bga-pin.ts /path/to/core")
const { parsePinNumberFromLabelsOrThrow } = await import(
  pathToFileURL(
    resolve(
      process.argv[2],
      "lib/utils/schematic/parsePinNumberFromLabelsOrThrow.ts",
    ),
  ).href
)
for (const labels of [{ A1: "DQ0" }, { pin1: ["A1", "DQ0"] }]) {
  try {
    console.log({
      labels,
      result: parsePinNumberFromLabelsOrThrow("DQ0", labels),
    })
  } catch (error) {
    console.log({
      labels,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
