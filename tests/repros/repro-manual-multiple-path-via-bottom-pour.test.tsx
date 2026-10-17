import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import ManualThroughViaBoard from "tests/fixtures/manual-through-via-board"
import { getManualViaPourDiagnostic } from "tests/fixtures/manual-via-pour-diagnostic"

test("BUG: pcbPaths also hides three through-via bottom GND shorts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ManualThroughViaBoard multiplePaths />)
  await circuit.renderUntilSettled()
  const result = getManualViaPourDiagnostic(circuit)
  expect(result.vias).toHaveLength(3)
  expect(result.vias.every((via) => !via.layers.includes("bottom"))).toBe(true)
  expect(result.compiledDrc).toHaveLength(0)
  expect(result.physicalDrc).toHaveLength(3)
  expect(result.foreignLandOverlapArea).toBeCloseTo(
    3 * Math.PI * (0.4 ** 2 - 0.2 ** 2),
    6,
  )
  await expect(result.snapshot).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
