import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("digital stimulus and eye diagram emit schema-valid simulation and IBIS records", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" pinLabels={{ pin1: "DATA" }} />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/driver.ibs",
          url: "https://example.com/driver.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{
          ".U1 > .DATA": { isOutput: true, isOutputEnabled: true },
        }}
      />
      <voltageprobe name="probe" connectsTo=".U1 > .DATA" />
      <analog.eyediagram
        name="eye"
        simulationRef=".run"
        probeRef=".probe"
        unitInterval="2ns"
        timeOrigin="0ns"
      />
      <analog.digitalstimulus
        name="data"
        simulationRef=".run"
        sourcePinRef=".U1 > .DATA"
        bitDuration="2ns"
        startTime="0ns"
        initialState={0}
        transmittedData={{
          transmissionType: "bits",
          bits: [0, 1, 1, 0],
          repeat: true,
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const stimulus = circuit.db.simulation_digital_stimulus.list()[0]
  expect(stimulus.bit_duration_ms).toBeCloseTo(0.000002, 14)
  expect(stimulus.transmission_pattern).toEqual({
    transmission_type: "bits",
    bits: [0, 1, 1, 0],
    repeat: true,
  })
  expect(circuit.db.simulation_eye_diagram.list()).toHaveLength(1)
  for (const record of circuit.getCircuitJson()) {
    if (record.type.startsWith("simulation_") || record.type.includes("ibis")) {
      expect(any_circuit_element.parse(record)).toEqual(record)
    }
  }
})
