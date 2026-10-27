import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS models and digital stimuli wait for async footprint ports", async () => {
  const footprintReady = Promise.withResolvers<void>()
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        test: async () => {
          await footprintReady.promise
          return { footprintCircuitJson: fp.string("soic4").circuitJson() }
        },
      },
    },
  })
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip name="U1" footprint="test:soic4" />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "pin1", "2": "pin2" }}
        ibisPinNameToReferencePortLabels={{ "1": { pullup: "pin2" } }}
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

  circuit.render()
  expect(circuit.db.source_port.list()).toHaveLength(0)
  expect(circuit.db.simulation_ibis_model.list()).toHaveLength(0)
  expect(circuit.db.simulation_digital_stimulus.list()).toHaveLength(0)
  footprintReady.resolve()
  await circuit.renderUntilSettled()

  const ports = circuit.db.source_port.list()
  expect(ports).toHaveLength(4)
  const dataPort = ports.find((port) => port.pin_number === 1)!
  const powerPort = ports.find((port) => port.pin_number === 2)!
  const models = circuit.db.simulation_ibis_model.list()
  expect(models).toHaveLength(1)
  expect(models[0].ibis_pin_name_to_source_port_id).toEqual({
    "1": dataPort.source_port_id,
    "2": powerPort.source_port_id,
  })
  expect(models[0].ibis_pin_name_to_reference_source_port_ids).toEqual({
    "1": { pullup_reference_source_port_id: powerPort.source_port_id },
  })
  const stimuli = circuit.db.simulation_digital_stimulus.list()
  expect(stimuli).toHaveLength(1)
  expect(stimuli[0].source_port_id).toBe(dataPort.source_port_id)
  const states = circuit.db.simulation_ibis_pin_state.list()
  expect(states).toHaveLength(1)
  expect(states[0].source_port_id).toBe(dataPort.source_port_id)
  expect(states[0].simulation_experiment_id).toBe(
    stimuli[0].simulation_experiment_id,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
