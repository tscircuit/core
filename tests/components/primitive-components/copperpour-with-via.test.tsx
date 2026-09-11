import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pour surrounds centered via on the same net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <via
        pcbX="0mm"
        pcbY="0mm"
        connectsTo="net.GND"
        fromLayer="top"
        toLayer="bottom"
        holeDiameter="0.6mm"
        outerDiameter="1.2mm"
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const stitchingCounts: number[] = []
  for (const { enableViaStitching, viaStitchPitch, globallyDisabled } of [
    { viaStitchPitch: "1mm" },
    { enableViaStitching: false, viaStitchPitch: "1mm" },
    { enableViaStitching: true, viaStitchPitch: "1mm" },
    { enableViaStitching: true, viaStitchPitch: "2mm" },
    { enableViaStitching: true, globallyDisabled: true },
  ]) {
    const { circuit: stitchingCircuit } = getTestFixture()
    if (globallyDisabled) stitchingCircuit._featurePcbViaStitching = false
    stitchingCircuit.add(
      <board
        width="10mm"
        height="10mm"
        enableViaStitching={enableViaStitching}
        viaStitchPitch={viaStitchPitch}
      >
        <net name="GND" />
        <copperpour connectsTo="net.GND" layer="top" />
        <copperpour connectsTo="net.GND" layer="bottom" />
      </board>,
    )
    await stitchingCircuit.renderUntilSettled()
    stitchingCounts.push(stitchingCircuit.db.pcb_via.list().length)
  }
  const [omitted, disabled, dense, sparse, globallyDisabled] = stitchingCounts
  expect(omitted).toBe(0)
  expect(disabled).toBe(0)
  expect(dense).toBeGreaterThan(sparse!)
  expect(sparse).toBeGreaterThan(0)
  expect(globallyDisabled).toBe(0)
})
