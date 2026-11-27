import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("stores opt-in phase skew samples in the rendered Circuit JSON", async () => {
  const sampleSpacingMm = 0.5
  const circuit = new RootCircuit({
    platform: { drcChecksDisabled: true },
    pcbPhaseSkewSampleSpacingMm: sampleSpacingMm,
  })
  circuit.add(
    <board width={12} height={5} routeRemaining={false}>
      <testpoint name="P1" footprintVariant="pad" pcbX={-4} pcbY={0.6} />
      <testpoint name="P2" footprintVariant="pad" pcbX={4} pcbY={0.6} />
      <testpoint name="N1" footprintVariant="pad" pcbX={-4} pcbY={-0.6} />
      <testpoint name="N2" footprintVariant="pad" pcbX={4} pcbY={-0.6} />
      <trace
        name="P"
        from=".P1 > .pin1"
        to=".P2 > .pin1"
        thickness={0.24}
        pcbPath={[]}
      />
      <trace
        name="N"
        from=".N1 > .pin1"
        to=".N2 > .pin1"
        thickness={0.24}
        pcbPath={[]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="P"
        negativeConnection="N"
        pcbTraceGap={0.96}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const phaseSkews = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_differential_pair_phase_skew")
  expect(phaseSkews).toHaveLength(1)
  for (const { segments } of [
    phaseSkews[0].positive_trace,
    phaseSkews[0].negative_trace,
  ]) {
    expect(segments).toHaveLength(16)
    expect(
      Math.max(
        ...segments.map(({ start, end }) =>
          Math.hypot(end.x - start.x, end.y - start.y),
        ),
      ),
    ).toBeCloseTo(sampleSpacingMm, 8)
  }
})
