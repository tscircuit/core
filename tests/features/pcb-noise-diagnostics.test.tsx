import { expect, test } from "bun:test"
import type { PcbNoiseChannelProps } from "@tscircuit/props"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard, noisePrbs } from "tests/fixtures/pcb-noise-board"

test("invalid noise selectors and physical layer ambiguity never emit a configuration", async () => {
  const cases: Array<{
    props: Partial<PcbNoiseChannelProps>
    message: string
  }> = [
    {
      props: { source: ".MISSING > .A" },
      message:
        'source signal selector ".MISSING > .A" must identify exactly one physical PCB port',
    },
    {
      props: { source: ".U1 > port" },
      message:
        'source signal selector ".U1 > port" must identify exactly one physical PCB port',
    },
    {
      props: { sourceReferenceLayer: undefined },
      message: "spans multiple layers; specify sourceReferenceLayer",
    },
    {
      props: { loadReferenceLayer: undefined },
      message: "spans multiple layers; specify loadReferenceLayer",
    },
    {
      props: { sourceLayer: "bottom" },
      message: 'has no physical port on layer "bottom"',
    },
    {
      props: { loadLayer: "bottom" },
      message: 'has no physical port on layer "bottom"',
    },
    {
      props: { sourceReference: ".U1 > .A" },
      message: "needs different physical signal and reference contacts",
    },
    {
      props: { loadReference: ".U2 > .A" },
      message: "needs different physical signal and reference contacts",
    },
  ]
  for (const { props, message } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <NoiseBoard>
        <simulation.pcbnoisesimulation duration="512ns" sampleInterval="20ps">
          <simulation.pcbnoisechannel
            name="a"
            role="aggressor"
            source=".U1 > .A"
            sourceReference=".U1 > .REF"
            sourceReferenceLayer="top"
            load=".U2 > .A"
            loadReference=".U2 > .REF"
            loadReferenceLayer="top"
            sourceImpedance="50ohm"
            loadImpedance="50ohm"
            loadBiasVoltage="0V"
            waveform={noisePrbs}
            {...props}
          />
        </simulation.pcbnoisesimulation>
      </NoiseBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
    expect(circuit.db.simulation_pcb_noise_configuration.list()).toHaveLength(0)
  }
})
