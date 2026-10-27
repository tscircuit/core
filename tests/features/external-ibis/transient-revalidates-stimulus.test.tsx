import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { AnalogTransientSimulation } from "lib/components/primitive-components/AnalogTransientSimulation"

test("changing an output to an input revalidates existing traffic", async () => {
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
      <analog.digitalstimulus
        name="data"
        simulationRef=".run"
        sourcePinRef=".U1 > .pin1"
        bitDuration="2ns"
        startTime="0ns"
        initialState={0}
        transmittedData={{ transmissionType: "bits", bits: "01", repeat: true }}
      />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{
          ".U1 > .pin1": { isOutput: true, isOutputEnabled: true },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sim = circuit.selectOne(".run") as AnalogTransientSimulation
  sim.setProps({
    ...sim.props,
    ibisPinStates: { ".U1 > .pin1": { isOutput: false } },
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow("enabled output")
  sim.setProps({
    ...sim.props,
    ibisPinStates: {
      ".U1 > .pin1": { isOutput: true, isOutputEnabled: true },
    },
  })
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_digital_stimulus.list()).toHaveLength(1)
})
