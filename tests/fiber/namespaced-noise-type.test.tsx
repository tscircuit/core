import { expect, test } from "bun:test"
import { simulation } from "lib"
import { noisePrbs } from "tests/fixtures/pcb-noise-board"

test("noise namespace and flat hosts retain explicit physical and electrical input types", () => {
  const port = (
    <simulation.pcbnoiseport
      name="a_tx"
      signal=".U1 > .A"
      reference=".U1 > .REF"
      referenceLayer="bottom"
    />
  )
  const source = (
    <simulation.pcbnoiseexcitation
      port="a_tx"
      role="aggressor"
      sourceModel={{ kind: "thevenin", resistance: "50ohm" }}
      waveform={noisePrbs}
    />
  )
  const flat = (
    <pcbnoisesimulation duration="512ns" sampleInterval="20ps">
      {port}
      {source}
    </pcbnoisesimulation>
  )
  expect(port.type).toBe(simulation.pcbnoiseport)
  expect(source.type).toBe(simulation.pcbnoiseexcitation)
  expect(flat.type).toBe("pcbnoisesimulation")
})

const missingReference = (
  // @ts-expect-error a physical reference selector is mandatory
  <simulation.pcbnoiseport name="a_tx" signal=".U1 > .A" />
)
const invalidLayer = (
  <simulation.pcbnoiseport
    name="a_tx"
    signal=".U1 > .A"
    reference=".U1 > .REF"
    // @ts-expect-error layer inputs use canonical physical PCB layers
    referenceLayer="middle"
  />
)
const noSourceDefaults = (
  // @ts-expect-error source impedance, waveform and role are mandatory
  <pcbnoiseexcitation port="a_tx" />
)
void missingReference
void invalidLayer
void noSourceDefaults
