import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { convertCircuitJsonToSimulationGraphSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("simulation graph renders multiple scope channels with graph display props", async () => {
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
        graphDisplayName="IIN"
        graphCenter={0.018}
        graphOffsetDivs={1}
        graphUnitsPerDiv={0.002}
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R_LOAD > .pin1",
        }}
      />
      <resistor name="R_LOAD" resistance="1k" schX={2} />
      <ammeter
        name="ILOAD"
        color="#8a35d7"
        graphDisplayName="ILOAD"
        graphCenter={0.002}
        graphOffsetDivs={-2}
        graphUnitsPerDiv={0.0005}
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
        graphDisplayName="VIN"
        graphCenter={5}
        graphOffsetDivs={2}
        graphUnitsPerDiv={0.1}
      />
      <voltageprobe
        name="VOUT"
        color="#0a8f3c"
        connectsTo=".R_LOAD > .pin2"
        referenceTo=".V1 > .pin2"
        graphDisplayName="VOUT"
        graphCenter={3.3}
        graphOffsetDivs={-1}
        graphUnitsPerDiv={0.05}
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
