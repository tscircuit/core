import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rectifierDiodeModel = `
.subckt RECTIFIER_DIODE ANODE CATHODE
D1 ANODE CATHODE DGEN
.model DGEN D
.ends RECTIFIER_DIODE
`

test("chip spiceModel custom diode subcircuit simulates a half-wave rectifier", async () => {
  let capturedSpice = ""
  const ngspiceEngine = await createNgspiceSpiceEngine()
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: {
          simulate: async (spiceString: string) => {
            capturedSpice = spiceString
            return ngspiceEngine.simulate(spiceString)
          },
        },
      },
    },
  })

  circuit.add(
    <board schMaxTraceDistance={10} routingDisabled>
      <voltagesource
        name="V1"
        voltage="5V"
        frequency="60Hz"
        waveShape="sinewave"
      />
      <chip
        name="D1"
        footprint="0402"
        pinLabels={{
          pin1: "ANODE",
          pin2: "CATHODE",
        }}
        spiceModel={<spicemodel source={rectifierDiodeModel} />}
      />
      <resistor name="RLOAD" resistance="1k" />

      <trace from=".V1 > .pin1" to=".D1 > .ANODE" />
      <trace from=".D1 > .CATHODE" to=".RLOAD > .pin1" />
      <trace from=".RLOAD > .pin2" to=".V1 > .pin2" />

      <voltageprobe name="VP_IN" connectsTo=".V1 > .pin1" />
      <voltageprobe name="VP_OUT" connectsTo=".RLOAD > .pin1" />

      <analogsimulation duration="100ms" spiceEngine="ngspice" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(capturedSpice).toContain(".subckt RECTIFIER_DIODE ANODE CATHODE")
  expect(capturedSpice).toContain(".ends RECTIFIER_DIODE")
  expect(capturedSpice).toMatch(
    /Xsimulation_spice_subcircuit_\S+\s+\S+\s+\S+\s+RECTIFIER_DIODE/,
  )

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.some((el) => el.type === "simulation_transient_voltage_graph"),
  ).toBe(true)

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
}, 60000)
