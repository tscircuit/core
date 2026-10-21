import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { AnalogDigitalStimulus } from "lib/components/primitive-components/AnalogDigitalStimulus"

test("editing traffic updates its exported bit pattern", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="BUFFER"
        ibisPinNameToPortLabel={{ "1": "pin1" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{
          ".U1 > .pin1": { isOutput: true, isOutputEnabled: true },
        }}
      />
      <analog.digitalstimulus
        name="data"
        simulationRef=".run"
        sourcePinRef=".U1 > .pin1"
        bitDuration="2ns"
        startTime="0ns"
        initialState={0}
        transmittedData={{ transmissionType: "bits", bits: "01", repeat: true }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const stimulus = circuit.selectOne(".data") as AnalogDigitalStimulus
  stimulus.setProps({
    ...stimulus.props,
    transmittedData: { transmissionType: "bits", bits: "10", repeat: true },
  })
  await circuit.renderUntilSettled()
  expect(
    circuit.db.simulation_digital_stimulus.list()[0].transmission_pattern.bits,
  ).toBe("10")
})
