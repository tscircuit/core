import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import ManualThroughViaBoard from "tests/fixtures/manual-through-via-board"
import { getManualViaPourDiagnostic } from "tests/fixtures/manual-via-pour-diagnostic"

test("pcbPaths preserves through-via barrels and bottom GND clearance", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ManualThroughViaBoard multiplePaths />)
  await circuit.renderUntilSettled()
  const result = getManualViaPourDiagnostic(circuit)
  expect(result.vias).toHaveLength(3)
  expect(result.vias.map((via) => via.layers)).toEqual([
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1", "inner2", "bottom"],
  ])
  expect(result.compiledDrc).toHaveLength(0)
  expect(result.physicalDrc).toHaveLength(0)
  expect(result.foreignLandOverlapArea).toBeCloseTo(0, 8)
  await expect(result.snapshot).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
