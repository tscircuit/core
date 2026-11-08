import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { gunzipSync } from "node:zlib"
import { NativeDdrBoard } from "@tscircuit/core-ddr-benchmark/circuits/native-ddr-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const sourcePath = fileURLToPath(
  import.meta.resolve("@tscircuit/core-ddr-benchmark/circuits/h3.json.gz"),
)
const source = JSON.parse(gunzipSync(readFileSync(sourcePath)).toString())

test("H3 DDR data bytes followed by a failed remaining phase", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<NativeDdrBoard source={source} />)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1400,
    height: 1000,
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    showPcbGroups: false,
    showDebugObjects: false,
  })
}, 60_000)
