import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { PairBoard } from "tests/fixtures/local-skew/pair-board"

test("invalid stackup layer thickness falls back to the board thickness", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <PairBoard
      positivePath={[]}
      negativePath={[
        { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
      ]}
      pcbTraceGap="0.45mm"
      thickness="1.6mm"
      fabricatorPreset="jlcpcb_standard"
    />,
  )
  await circuit.renderUntilSettled()
  const [stackup] = circuit.db.pcb_stackup.list()
  expect(
    getStoredLocalSkew(circuit.getCircuitJson())[0].max_local_skew,
  ).toBeCloseTo(2.98, 5)

  for (const thickness of [-0.25, NaN, Infinity, undefined]) {
    stackup.layers[1].thickness = thickness
    circuit.firstChild!._markDirty("PcbDifferentialPairLocalSkewRender")
    circuit.render()
    const pairs = getStoredLocalSkew(circuit.getCircuitJson())
    expect(pairs).toHaveLength(1)
    expect(pairs[0].max_local_skew).toBeCloseTo(3.2, 5)
  }
  await expect(localSkewSvg(circuit.getCircuitJson())).toMatchSvgSnapshot(
    import.meta.path,
  )
})
