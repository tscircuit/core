import { expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import Project from "./index"

test("abse__gameboy matches pcb snapshot", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Project />)

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)

  const svg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson())
  const testPath = import.meta.path.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
  const snapshotPath = path.join(
    snapshotDir,
    `${path.basename(testPath)}-pcb.snap.svg`,
  )

  if (!existsSync(snapshotPath) || process.env.BUN_UPDATE_SNAPSHOTS) {
    mkdirSync(snapshotDir, { recursive: true })
    writeFileSync(snapshotPath, svg)
  }

  expect(svg).toBe(readFileSync(snapshotPath, "utf-8"))
}, 1_000_000)
