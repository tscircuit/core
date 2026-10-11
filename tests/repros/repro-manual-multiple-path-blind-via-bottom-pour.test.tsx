import { expect, test } from "bun:test"
import { Point } from "@flatten-js/core"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import ManualThroughViaBoard from "tests/fixtures/manual-through-via-board"
import { getManualViaPourDiagnostic } from "tests/fixtures/manual-via-pour-diagnostic"

test("pcbPaths respects explicitly enabled blind/buried vias", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ManualThroughViaBoard allowBlindAndBuriedVias multiplePaths />)
  await circuit.renderUntilSettled()
  const result = getManualViaPourDiagnostic(circuit)
  expect(result.vias.map((via) => via.layers)).toEqual([
    ["top", "inner1"],
    ["inner1", "inner2"],
    ["inner2", "inner1", "top"],
  ])
  expect(result.compiledDrc).toHaveLength(0)
  expect(result.physicalDrc).toHaveLength(0)
  expect(result.foreignLandOverlapArea).toBe(0)
  for (const via of result.vias) {
    expect(
      result.pours.some((pour) =>
        getPourPolygon(pour).contains(new Point(via.x, via.y)),
      ),
    ).toBe(true)
  }
  await expect(result.snapshot).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
