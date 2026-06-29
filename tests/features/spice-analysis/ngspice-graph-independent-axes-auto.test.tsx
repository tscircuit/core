import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

test("ngspice simulation graph auto-scales voltage and current graphs on independent axes", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board width="12mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource
        name="V1"
        voltage="5V"
        frequency="1kHz"
        waveShape="sinewave"
        schX={-4}
      />
      <ammeter
        name="IIN"
        color="#e05a00"
        graphDisplayName="IIN auto"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={0} />
      <ammeter
        name="ILOAD"
        color="#8a35d7"
        graphDisplayName="ILOAD auto"
        connections={{
          pos: ".R1 > .pin2",
          neg: ".R2 > .pin1",
        }}
      />
      <resistor name="R2" resistance="2k" schX={4} />
      <trace from=".R2 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="VIN"
        color="#315cff"
        connectsTo=".IIN > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="VIN auto"
      />
      <voltageprobe
        name="VMID"
        color="#0a8f3c"
        connectsTo=".ILOAD > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="VMID auto"
      />
      <analogsimulation
        name="ngspice auto independent axes"
        duration="2ms"
        timePerStep="100us"
        spiceEngine="ngspice"
        graphIndependentAxes
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const graphScopeTraces = circuitJson.filter(isGraphScopeTrace)

  expect(graphScopeTraces).toHaveLength(4)
  expect(
    graphScopeTraces.every((trace) =>
      Number.isFinite(trace.volts_per_div ?? trace.amps_per_div),
    ),
  ).toBe(true)
  expect(
    graphScopeTraces.map((trace) => trace.display_center_offset_divs),
  ).toEqual([3, 1, -1, -3])

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
}, 60000)
