import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inflation honors analogSimulationDisabled for external IBIS records", async () => {
  const source = getTestFixture().circuit
  source.add(
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
      <voltageprobe name="probe" connectsTo=".U1 > .pin1" />
      <analog.eyediagram
        name="eye"
        simulationRef=".run"
        probeRef=".probe"
        unitInterval="2ns"
        timeOrigin="0ns"
      />
    </board>,
  )
  await source.renderUntilSettled()
  const { circuit } = getTestFixture({
    platform: { analogSimulationDisabled: true },
  })
  circuit.add(
    <board routingDisabled>
      <subcircuit name="Cached" circuitJson={source.getCircuitJson()} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect([
    circuit.db.simulation_ibis_model.list().length,
    circuit.db.simulation_ibis_pin_state.list().length,
    circuit.db.simulation_digital_stimulus.list().length,
    circuit.db.simulation_eye_diagram.list().length,
  ]).toEqual([0, 0, 0, 0])
})
