import { expect, spyOn, test } from "bun:test"
import type {
  AnalogDigitalStimulusProps,
  IbisModelDefinition,
} from "@tscircuit/props"
import { any_circuit_element } from "circuit-json"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import expected from "./ddr-dq-external-ibis.expected.json"
import { Fragment } from "react"

// Reduced from am3352-ddr-eye/examples/ddr-dq/index.circuit.tsx: a DQ victim
// with quiet/switching differential strobe neighbors and explicit supply rails.
async function renderDdrDq(
  bits: AnalogDigitalStimulusProps["transmittedData"]["bits"],
) {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="15mm" routingDisabled>
      {(
        [
          ["U1", ["M3", "P1", "P2", "E5", "A1", "VREF"]],
          ["U3", ["E3", "F3", "G3", "A1", "B1", "VREF"]],
        ] as const
      ).map(([name, pins]) => {
        const references = {
          pullup: pins[3],
          pulldown: pins[4],
          powerClamp: pins[3],
          groundClamp: pins[4],
          external: pins[5],
        }
        const model: IbisModelDefinition = {
          ibisModelAsset: {
            project_relative_path: "models/synthetic-ddr.ibs",
            url: "models/synthetic-ddr.ibs",
            mimetype: "text/plain",
          },
          ibisComponentName:
            name === "U1" ? "SYNTHETIC_DRIVER" : "SYNTHETIC_RECEIVER",
          ibisPinNameToPortLabel: Object.fromEntries(
            pins.map((pin) => [pin, pin]),
          ),
          ibisPinNameToModelName: Object.fromEntries(
            pins
              .slice(0, 3)
              .map((pin) => [pin, name === "U1" ? "OUTPUT" : "INPUT"]),
          ),
          ibisPinNameToReferencePortLabels: Object.fromEntries(
            pins.slice(0, 3).map((pin) => [pin, references]),
          ),
          modelValueCorner: "typical",
          includePackageParasitics: true,
        }
        return (
          <Fragment key={name}>
            <chip
              name={name}
              pinLabels={Object.fromEntries(
                pins.map((pin, i) => [`pin${i + 1}`, pin]),
              )}
              footprint={
                <footprint>
                  {pins.map((pin, i) => (
                    <Fragment key={pin}>
                      <smtpad
                        portHints={[`pin${i + 1}`]}
                        pcbX={i - 2.5}
                        pcbY={0}
                        shape="rect"
                        width="0.5mm"
                        height="1mm"
                      />
                    </Fragment>
                  ))}
                </footprint>
              }
            />
            <ibismodel componentRef={`chip.${name}`} {...model} />
          </Fragment>
        )
      })}
      <trace from=".U1 > .M3" to=".U3 > .E3" />
      <trace from=".U1 > .P1" to=".U3 > .F3" />
      <trace from=".U1 > .P2" to=".U3 > .G3" />
      <voltageprobe
        name="DQ0_RX"
        connectsTo=".U3 > .E3"
        referenceTo=".U3 > .B1"
      />
      <voltageprobe
        name="DDR_RX"
        connectsTo=".U3 > .F3"
        referenceTo=".U3 > .G3"
      />
      {(["QUIET", "SWITCHING"] as const).map((activity) => {
        const simulationRef = `.DDR_${activity}`
        return [
          <analog.transientsimulation
            key={`simulation-${activity}`}
            name={`DDR_${activity}`}
            duration="160ns"
            timePerStep="10ps"
            spiceEngine="pcb_spice"
            ibisPinStates={{
              ".U1 > .M3": { isOutput: true, isOutputEnabled: true },
              ".U1 > .P1": { isOutput: true, isOutputEnabled: true },
              ".U1 > .P2": { isOutput: true, isOutputEnabled: true },
              ".U3 > .E3": { isOutput: false },
              ".U3 > .F3": { isOutput: false },
              ".U3 > .G3": { isOutput: false },
            }}
          />,
          ...(["M3", "P1", "P2"] as const).map((pin) => (
            <analog.digitalstimulus
              key={`${pin}-${activity}`}
              name={`${pin}_${activity}`}
              simulationRef={simulationRef}
              sourcePinRef={`.U1 > .${pin}`}
              bitDuration="2.5ns"
              startTime={pin === "M3" ? "0ns" : "1.25ns"}
              initialState={0}
              inverted={pin === "P2"}
              transmittedData={{
                transmissionType: "bits",
                bits: pin === "M3" ? bits : activity === "QUIET" ? "0" : "01",
                repeat: true,
              }}
            />
          )),
          <analog.eyediagram
            key={`victim-eye-${activity}`}
            name={`DQ0_receive_eye_${activity}`}
            simulationRef={simulationRef}
            probeRef=".DQ0_RX"
            unitInterval="2.5ns"
            timeOrigin="0ns"
            startTime="40ns"
          />,
          <analog.eyediagram
            key={`strobe-eye-${activity}`}
            name={`DQS_receive_eye_${activity}`}
            simulationRef={simulationRef}
            probeRef=".DDR_RX"
            unitInterval="2.5ns"
            timeOrigin="1.25ns"
            startTime="40ns"
          />,
        ]
      })}
    </board>,
  )
  const fetch = spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("The DDR contract must render without network access"),
  )
  try {
    await circuit.renderUntilSettled()
    expect(fetch).not.toHaveBeenCalled()
  } finally {
    fetch.mockRestore()
  }
  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((element) => element.type.includes("error")),
  ).toEqual([])
  for (const element of circuitJson) any_circuit_element.parse(element)
  return circuit
}

test("DDR DQ external IBIS consumer contract uses canonical simulation fields", async () => {
  const circuit = await renderDdrDq("0110")
  const experiments = circuit.db.simulation_experiment.list()
  expect(experiments.map((experiment) => experiment.spice_engine)).toEqual([
    "pcb_spice",
    "pcb_spice",
  ])
  const models = circuit.db.simulation_ibis_model.list()
  expect(models).toHaveLength(2)
  for (const model of models) {
    const ports = model.ibis_pin_name_to_source_port_id
    const driver = model.ibis_component_name === "SYNTHETIC_DRIVER"
    for (const pin of driver ? ["M3", "P1", "P2"] : ["E3", "F3", "G3"]) {
      expect(model.ibis_pin_name_to_reference_source_port_ids?.[pin]).toEqual({
        pullup_reference_source_port_id: ports[driver ? "E5" : "A1"],
        pulldown_reference_source_port_id: ports[driver ? "A1" : "B1"],
        power_clamp_reference_source_port_id: ports[driver ? "E5" : "A1"],
        ground_clamp_reference_source_port_id: ports[driver ? "A1" : "B1"],
        external_reference_source_port_id: ports.VREF,
      })
    }
  }
  for (const experiment of experiments) {
    const states = circuit.db.simulation_ibis_pin_state.list({
      simulation_experiment_id: experiment.simulation_experiment_id,
    })
    expect(states).toHaveLength(6)
    for (const model of models) {
      const driver = model.ibis_component_name === "SYNTHETIC_DRIVER"
      for (const pin of driver ? ["M3", "P1", "P2"] : ["E3", "F3", "G3"]) {
        expect(
          states.find(
            (state) =>
              state.source_port_id ===
              model.ibis_pin_name_to_source_port_id[pin],
          ),
        ).toMatchObject({
          is_output: driver,
          ...(driver ? { is_output_enabled: true } : {}),
        })
      }
    }
  }
  const stimuli = circuit.db.simulation_digital_stimulus.list()
  expect(stimuli).toHaveLength(6)
  for (const stimulus of stimuli) {
    expect(stimulus.bit_duration_ms).toBeCloseTo(0.0000025, 14)
    expect(stimulus.transmission_pattern.transmission_type).toBe("bits")
    expect(stimulus).not.toHaveProperty("unit_interval_ms")
    expect(stimulus).not.toHaveProperty("pattern")
  }
  const eyes = circuit.db.simulation_eye_diagram.list()
  expect(eyes).toHaveLength(4)
  for (const eye of eyes)
    expect(eye.unit_interval_ms).toBeCloseTo(0.0000025, 14)
  const simulationJson = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type.startsWith("simulation_") ||
        [
          "source_component",
          "source_port",
          "source_group",
          "source_trace",
        ].includes(element.type),
    )
  expect(JSON.parse(JSON.stringify(simulationJson))).toEqual(expected)

  const arrayCircuit = await renderDdrDq([0, 1, 1, 0])
  // circuit-json preserves the input representation: arrays stay arrays, strings
  // stay strings. Only normalize the bit sequence when comparing semantics.
  const arrayStimuli = arrayCircuit.db.simulation_digital_stimulus.list()
  for (const stimulus of arrayStimuli.filter((stimulus) =>
    stimulus.name.startsWith("M3_"),
  )) {
    expect(stimulus.transmission_pattern.bits).toEqual([0, 1, 1, 0])
  }
  expect(stimuli).toEqual(
    arrayStimuli.map((stimulus) => ({
      ...stimulus,
      transmission_pattern: {
        ...stimulus.transmission_pattern,
        bits: Array.isArray(stimulus.transmission_pattern.bits)
          ? stimulus.transmission_pattern.bits.join("")
          : stimulus.transmission_pattern.bits,
      },
    })),
  )
})
