import { expect, test } from "bun:test"
import { simulation } from "lib"
import { noisePrbs } from "tests/fixtures/pcb-noise-board"

test("compact noise namespace and flat hosts retain explicit physical and electrical input types", () => {
  const channel = (
    <simulation.pcbnoisechannel
      name="a"
      role="aggressor"
      source=".U1 > .A"
      sourceReference=".U1 > .REF"
      sourceReferenceLayer="bottom"
      load=".U2 > .A"
      loadReference=".U2 > .REF"
      loadReferenceLayer="bottom"
      sourceImpedance="50ohm"
      loadImpedance="50ohm"
      loadBiasVoltage="0V"
      waveform={noisePrbs}
    />
  )
  const eye = (
    <simulation.pcbnoiseeye
      channel="a"
      timing={{ kind: "source", channel: "a", sampleOffset: "1ns" }}
    />
  )
  const flat = (
    <pcbnoisesimulation duration="512ns" sampleInterval="20ps">
      {channel}
      {eye}
    </pcbnoisesimulation>
  )
  expect(channel.type).toBe(simulation.pcbnoisechannel)
  expect(eye.type).toBe(simulation.pcbnoiseeye)
  expect(flat.type).toBe("pcbnoisesimulation")
})

const missingReference = (
  // @ts-expect-error source and load physical reference selectors are mandatory
  <simulation.pcbnoisechannel name="a" source=".U1 > .A" load=".U2 > .A" />
)
const noElectricalDefaults = (
  // @ts-expect-error impedances, load bias, waveform and role are mandatory
  <pcbnoisechannel
    name="a"
    source=".U1 > .A"
    sourceReference=".U1 > .REF"
    load=".U2 > .A"
    loadReference=".U2 > .REF"
  />
)
void missingReference
void noElectricalDefaults
