import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simulation declarations and ibis models can reference pins and components in nested subcircuits", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        pcb_spice: {
          async simulate() {
            return { simulationResultCircuitJson: [] }
          },
        },
      },
    },
  })

  circuit.add(
    <board width="30mm" height="15mm" routingDisabled>
      <subcircuit name="CPU">
        <chip
          name="U1"
          footprint="soic4"
          pinLabels={{ pin1: "DQ", pin2: "VDD", pin3: "GND" }}
        />
      </subcircuit>
      <subcircuit name="RAM" pcbX={5}>
        <chip
          name="U3"
          footprint="soic4"
          pinLabels={{ pin1: "DQ", pin2: "VDD", pin3: "GND" }}
        />
      </subcircuit>
      <trace from=".CPU > .U1 > .DQ" to=".RAM > .U3 > .DQ" />
      <ibismodel
        componentRef=".CPU > .U1"
        ibisModelAsset={{
          project_relative_path: "models/cpu.ibs",
          url: "https://example.com/cpu.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="CPU_DRIVER"
        ibisPinNameToPortLabel={{ "1": "DQ" }}
        ibisPinNameToModelName={{ "1": "DQ_OUT" }}
        ibisPinNameToReferencePortLabels={{
          "1": {
            pullup: "VDD",
            pulldown: "GND",
            powerClamp: "VDD",
            groundClamp: "GND",
            external: "GND",
          },
        }}
        modelValueCorner="maximum"
        includePackageParasitics={false}
      />
      <ibismodel
        componentRef=".RAM > .U3"
        ibisModelAsset={{
          project_relative_path: "models/ram.ibs",
          url: "https://example.com/ram.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="RAM_RECEIVER"
        ibisPinNameToPortLabel={{ "1": "DQ" }}
        ibisPinNameToModelName={{ "1": "DQ_IN" }}
        ibisPinNameToReferencePortLabels={{
          "1": {
            pullup: "VDD",
            pulldown: "GND",
            powerClamp: "VDD",
            groundClamp: "GND",
            external: "GND",
          },
        }}
        modelValueCorner="maximum"
        includePackageParasitics={false}
      />
      <voltageprobe
        name="DQ_RX"
        connectsTo=".RAM > .U3 > .DQ"
        referenceTo=".RAM > .U3 > .GND"
      />
      <analog.transientsimulation
        name="WRITE"
        spiceEngine="pcb_spice"
        duration="10ns"
        timePerStep="10ps"
        ibisPinStates={{
          ".CPU > .U1 > .DQ": { isOutput: true, isOutputEnabled: true },
          ".RAM > .U3 > .DQ": { isOutput: false },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const ibisModels = circuitJson.filter(
    (e) => e.type === "simulation_ibis_model",
  )
  expect(ibisModels.length).toBe(2)

  const simulations = circuitJson.filter(
    (e) => e.type === "simulation_experiment",
  )
  expect(simulations.length).toBe(1)
})
