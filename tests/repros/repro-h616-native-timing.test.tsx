import { expect, test } from "bun:test"
import H616DdrBoard from "@tscircuit/core-ddr-benchmark/circuits/h616"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("H616 retains the original native DDR paths and skew rules", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<H616DdrBoard />)
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_autorouting_error.list().map((error) => error.message),
  ).toMatchInlineSnapshot()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 1000,
    viewport: { minX: -10.5, maxX: 12.5, minY: 1, maxY: 20.5 },
    shouldDrawRatsNest: false,
    showDebugObjects: false,
  })
}, 120000)
