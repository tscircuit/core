import { expect, test } from "bun:test"
import H616Ddr3 from "tests/fixtures/h616-ddr3"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("H616 DDR3 routes all 53 native nets with the declared bus constraints", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<H616Ddr3 />)
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 1000,
    viewport: { minX: -10.5, maxX: 12.5, minY: 1, maxY: 20.5 },
    shouldDrawRatsNest: false,
    showDebugObjects: false,
  })
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
}, 130000)
