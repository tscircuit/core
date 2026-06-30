import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

test("ngspice simulation graph explicit probe options override independent axis auto-scaling", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="10V" schX={-3} />
      <ammeter
        name="I_CUSTOM"
        color="#8a35d7"
        graphDisplayName="I ngspice explicit"
        graphCenter={0.004}
        graphVerticalOffset="1mA"
        graphCurrentPerDiv="2mA"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={2} />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="V_CUSTOM"
        color="#315cff"
        connectsTo=".I_CUSTOM > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V ngspice explicit"
        graphCenter={2}
        graphVerticalOffset="1V"
        graphVoltagePerDiv="2V"
      />
      <analogsimulation
        name="ngspice explicit independent axes"
        duration="1ms"
        timePerStep="100us"
        spiceEngine="ngspice"
        graphIndependentAxes
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const graphScopeTraces = circuitJson.filter(isGraphScopeTrace)

  expect(graphScopeTraces).toHaveLength(2)
  expect(graphScopeTraces).toMatchObject([
    {
      display_name: "V ngspice explicit",
      display_center_value: 2,
      display_center_offset_divs: 0.5,
      volts_per_div: 2,
    },
    {
      display_name: "I ngspice explicit",
      display_center_value: 0.004,
      display_center_offset_divs: 0.5,
      amps_per_div: 0.002,
    },
  ])

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
}, 60000)
