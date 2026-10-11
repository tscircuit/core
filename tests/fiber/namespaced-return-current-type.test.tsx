import { expect, test } from "bun:test"
import { simulation } from "lib"
import { returnCurrentExcitationProps } from "tests/fixtures/pcb-return-current-board"

test("simulation namespace keeps canonical excitation prop types", () => {
  const excitation = (
    <simulation.pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
  )
  const experiment = (
    <simulation.pcbreturncurrentsimulation name="Typed experiment">
      {excitation}
    </simulation.pcbreturncurrentsimulation>
  )
  expect(excitation.type).toBe(simulation.pcbreturncurrentexcitation)
  expect(experiment.type).toBe(simulation.pcbreturncurrentsimulation)
})

const missingRequiredTerminals = (
  // @ts-expect-error explicit signal, ground, return and electrical props are required
  <simulation.pcbreturncurrentexcitation source=".U1 > .OUT" />
)

const invalidReferenceLayer = (
  <simulation.pcbreturncurrentexcitation
    {...returnCurrentExcitationProps}
    // @ts-expect-error reference layers use canonical PCB LayerRef inputs
    returnSourceLayer="middle"
  />
)

const unsupportedFrequency = (
  <simulation.pcbreturncurrentexcitation
    {...returnCurrentExcitationProps}
    // @ts-expect-error frequency is a simulation CLI run option
    frequency="100MHz"
  />
)

void missingRequiredTerminals
void invalidReferenceLayer
void unsupportedFrequency
