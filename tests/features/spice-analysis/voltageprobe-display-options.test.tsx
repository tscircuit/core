import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("voltageprobe emits display options", async () => {
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
        display={{
          label: "VO",
          center: 4.2,
          offsetDivs: 3,
          unitsPerDiv: 0.05,
        }}
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
    display_options: {
      label: "VO",
      center: 4.2,
      offset_divs: 3,
      units_per_div: 0.05,
    },
  })
  expect(
    circuit
      .getCircuitJson()
      .some((el) => el.type === "simulation_transient_voltage_graph"),
  ).toBe(true)

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
