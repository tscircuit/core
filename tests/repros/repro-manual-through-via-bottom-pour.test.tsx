import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import ManualThroughViaBoard from "tests/fixtures/manual-through-via-board"
import { getManualViaPourDiagnostic } from "tests/fixtures/manual-via-pour-diagnostic"

test("manual through-via spans clear three bottom GND short locations", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ManualThroughViaBoard />)
  await circuit.renderUntilSettled()
  const original = structuredClone(circuit.getCircuitJson())
  const result = getManualViaPourDiagnostic(circuit)
  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    num_layers: 4,
    allow_blind_and_buried_vias: false,
  })
  expect(result.vias).toHaveLength(3)
  expect(result.vias.map((via) => via.layers)).toEqual([
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1", "inner2", "bottom"],
  ])
  expect(result.vias.map((via) => [via.from_layer, via.to_layer])).toEqual([
    ["top", "inner1"],
    ["inner1", "inner2"],
    ["inner2", "top"],
  ])
  expect(result.pours.length).toBeGreaterThan(0)
  expect(result.compiledDrc).toHaveLength(0)
  expect(result.physicalDrc).toHaveLength(0)
  for (const via of result.vias) {
    const physicalVia = result.physical.find(
      (element) =>
        element.type === "pcb_via" && element.pcb_via_id === via.pcb_via_id,
    )
    expect(physicalVia).toMatchObject({
      layers: ["top", "inner1", "inner2", "bottom"],
    })
    expect(
      result.physicalDrc.some((error) =>
        error.pcb_placement_error_id.includes(via.pcb_via_id),
      ),
    ).toBe(false)
  }
  expect(result.foreignLandOverlapArea).toBeCloseTo(0, 8)
  expect(circuit.getCircuitJson()).toEqual(original)
  await expect(result.snapshot).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
