import { expect, test } from "bun:test"
import type { IbisModelDefinition } from "@tscircuit/props"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pins = ["DQ", "VDD", "GND"] as const

function model(componentName: string, modelName: string): IbisModelDefinition {
  const references = {
    pullup: "VDD",
    pulldown: "GND",
    powerClamp: "VDD",
    groundClamp: "GND",
    external: "GND",
  }
  return {
    ibisModelAsset: {
      project_relative_path: "models/synthetic.ibs",
      url: "models/synthetic.ibs",
      mimetype: "text/plain",
    },
    ibisComponentName: componentName,
    ibisPinNameToPortLabel: { "1": "DQ", "2": "VDD", "3": "GND" },
    ibisPinNameToModelName: { "1": modelName },
    ibisPinNameToReferencePortLabels: { "1": references },
    modelValueCorner: "typical",
    includePackageParasitics: false,
  }
}

function Part({ subcircuit, name }: { subcircuit: string; name: string }) {
  return (
    <subcircuit name={subcircuit} pcbX={subcircuit === "CPU" ? -5 : 5}>
      <chip
        name={name}
        footprint="soic4"
        pinLabels={Object.fromEntries(
          pins.map((pin, i) => [`pin${i + 1}`, pin]),
        )}
      />
    </subcircuit>
  )
}

// A routed channel commonly joins two subcircuits (a processor and its
// memory). Declarations in the enclosing board may reference both ends with
// explicit subcircuit-qualified selectors.
test("simulation declarations can reference pins in nested subcircuits", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="15mm" routingDisabled>
      <Part subcircuit="CPU" name="U1" />
      <Part subcircuit="RAM" name="U3" />
      <trace from=".CPU > .U1 > .DQ" to=".RAM > .U3 > .DQ" />
      <ibismodel componentRef=".CPU > .U1" {...model("DRIVER", "OUTPUT")} />
      <ibismodel componentRef=".RAM > .U3" {...model("RECEIVER", "INPUT")} />
      <voltageprobe
        name="DQ_RX"
        connectsTo=".RAM > .U3 > .DQ"
        referenceTo=".RAM > .U3 > .GND"
      />
      <analog.transientsimulation
        name="WRITE"
        duration="20ns"
        timePerStep="10ps"
        spiceEngine="pcb_spice"
        ibisPinStates={{
          ".CPU > .U1 > .DQ": { isOutput: true, isOutputEnabled: true },
          ".RAM > .U3 > .DQ": { isOutput: false },
        }}
      />
      <analog.digitalstimulus
        name="DQ_DATA"
        simulationRef=".WRITE"
        sourcePinRef=".CPU > .U1 > .DQ"
        bitDuration="2ns"
        startTime="0ns"
        initialState={0}
        transmittedData={{
          transmissionType: "bits",
          bits: "0110",
          repeat: true,
        }}
      />
      <analog.eyediagram
        name="DQ_EYE"
        simulationRef=".WRITE"
        probeRef=".DQ_RX"
        unitInterval="2ns"
        timeOrigin="0ns"
        startTime="4ns"
      />
    </board>,
  )
  circuit.render()

  const json = circuit.getCircuitJson()
  expect(
    json.filter(
      (r) =>
        r.type === "source_failed_to_create_component_error" ||
        ("error_type" in r && typeof r.error_type === "string"),
    ),
  ).toEqual([])

  const port = (component: string, label: string) => {
    const owner = json.find(
      (r) => r.type === "source_component" && r.name === component,
    )
    return json.find(
      (r) =>
        r.type === "source_port" &&
        r.source_component_id === (owner as any).source_component_id &&
        r.name === label,
    ) as any
  }
  const driverDq = port("U1", "DQ").source_port_id
  const receiverDq = port("U3", "DQ").source_port_id

  const models = json.filter((r) => r.type === "simulation_ibis_model") as any[]
  expect(models.map((m) => m.ibis_component_name).sort()).toEqual([
    "DRIVER",
    "RECEIVER",
  ])
  const states = json.filter(
    (r) => r.type === "simulation_ibis_pin_state",
  ) as any[]
  expect(states.map((s) => s.source_port_id).sort()).toEqual(
    [driverDq, receiverDq].sort(),
  )
  const stimulus = json.find(
    (r) => r.type === "simulation_digital_stimulus",
  ) as any
  expect(stimulus.source_port_id).toBe(driverDq)
  expect(json.filter((r) => r.type === "simulation_eye_diagram")).toHaveLength(
    1,
  )
})
