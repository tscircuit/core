import { expect, test } from "bun:test"
import type { PcbNoisePortProps } from "@tscircuit/props"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard } from "tests/fixtures/pcb-noise-board"

test("invalid noise selectors and physical layer ambiguity never emit a configuration", async () => {
  const cases: Array<{ props: Partial<PcbNoisePortProps>; message: string }> = [
    {
      props: { signal: ".MISSING > .A" },
      message:
        'Signal selector ".MISSING > .A" must identify exactly one physical PCB port',
    },
    {
      props: { signal: ".U1 > port" },
      message:
        'Signal selector ".U1 > port" must identify exactly one physical PCB port',
    },
    {
      props: { referenceLayer: undefined },
      message: "spans multiple layers; specify referenceLayer",
    },
    {
      props: { signalLayer: "bottom" },
      message: 'has no physical port on layer "bottom"',
    },
    {
      props: { reference: ".U1 > .A" },
      message: "needs different physical signal and reference contacts",
    },
  ]
  for (const { props, message } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <NoiseBoard>
        <simulation.pcbnoisesimulation duration="512ns" sampleInterval="20ps">
          <simulation.pcbnoiseport
            name="a_tx"
            signal=".U1 > .A"
            reference=".U1 > .REF"
            referenceLayer="top"
            {...props}
          />
          <simulation.pcbnoiseobservation
            name="voltage"
            port="a_tx"
            quantity="voltage"
          />
        </simulation.pcbnoisesimulation>
      </NoiseBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
    expect(circuit.db.simulation_pcb_noise_configuration.list()).toHaveLength(0)
  }
})
