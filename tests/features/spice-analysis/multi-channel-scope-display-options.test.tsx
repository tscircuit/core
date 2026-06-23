import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { convertCircuitJsonToSimulationGraphSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("simulation graph renders multiple scope channels with display options", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="5V" schX={-4} />
      <ammeter
        name="IIN"
        color="#e05a00"
        display={{
          label: "IIN",
          center: 0.018,
          offsetDivs: 1,
          unitsPerDiv: 0.002,
        }}
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R_LOAD > .pin1",
        }}
      />
      <resistor name="R_LOAD" resistance="1k" schX={2} />
      <ammeter
        name="ILOAD"
        color="#8a35d7"
        display={{
          label: "ILOAD",
          center: 0.002,
          offsetDivs: -2,
          unitsPerDiv: 0.0005,
        }}
        connections={{
          pos: ".R_LOAD > .pin2",
          neg: ".V1 > .pin2",
        }}
      />
      <voltageprobe
        name="VIN"
        color="#315cff"
        connectsTo=".IIN > .pos"
        referenceTo=".V1 > .pin2"
        display={{
          label: "VIN",
          center: 5,
          offsetDivs: 2,
          unitsPerDiv: 0.1,
        }}
      />
      <voltageprobe
        name="VOUT"
        color="#0a8f3c"
        connectsTo=".R_LOAD > .pin2"
        referenceTo=".V1 > .pin2"
        display={{
          label: "VOUT",
          center: 3.3,
          offsetDivs: -1,
          unitsPerDiv: 0.05,
        }}
      />
      <analogsimulation
        name="multi channel scope"
        duration="4ms"
        timePerStep="1ms"
        spiceEngine="ngspice"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  for (let attempt = 0; attempt < 5; attempt++) {
    const graphCount = circuit
      .getCircuitJson()
      .filter((el) => el.type.startsWith("simulation_transient_")).length
    if (graphCount === 4) break
    await Bun.sleep(100)
    await circuit.renderUntilSettled()
  }

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((el) => el.type === "simulation_oscilloscope_trace"),
  ).toHaveLength(4)
  expect(
    circuitJson.filter((el) => el.type.startsWith("simulation_transient_")),
  ).toHaveLength(4)

  const simulationExperiment = circuitJson.find(
    (el) => el.type === "simulation_experiment",
  )
  expect(simulationExperiment).toBeDefined()
  if (!simulationExperiment) return

  expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
}, 60000)
