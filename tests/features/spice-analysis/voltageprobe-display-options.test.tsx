import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("voltageprobe emits graph display name", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="4.2V" />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: "V1.pin1", pin2: "V1.pin2" }}
      />
      <voltageprobe
        name="VOUT_PROBE"
        connectsTo=".R1 > .pin1"
        referenceTo=".R1 > .pin2"
        graphDisplayName="VO"
      />
      <analogsimulation
        duration="1ms"
        timePerStep="50us"
        spiceEngine="ngspice"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.simulation_voltage_probe.list()[0]).toMatchObject({
    name: "VOUT_PROBE",
  })
  expect(circuit.db.simulation_voltage_probe.list()[0]).not.toHaveProperty(
    "display_options",
  )
  expect(circuit.db.simulation_oscilloscope_trace.list()[0]).toMatchObject({
    display_name: "VO",
  })
}, 60000)
