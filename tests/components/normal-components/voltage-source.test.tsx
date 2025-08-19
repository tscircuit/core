import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<voltagesource /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <voltagesource
        name="VS1"
        voltage="5V"
        frequency="60Hz"
        waveShape="sinewave"
      />
      <resistor name="R1" resistance="10k" pcbY={-2} schY={-2} />
      <trace from={".VS1 > .pin1"} to={".R1 > .pin1"} />
      <trace from={".VS1 > .pin2"} to={".R1 > .pin2"} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "VS1",
  }) as any

  expect(sourceComponent).toBeDefined()
  expect(sourceComponent.ftype).toBe("simple_voltage_source")
  expect(sourceComponent.voltage).toBe(5)
  expect(sourceComponent.frequency).toBe(60)
  expect(sourceComponent.wave_shape).toBe("sinewave")

  const simSource = (circuit.db as any).simulation_voltage_source.list()[0]
  expect(simSource).toBeDefined()
  expect(simSource.is_dc_source).toBe(false)
  expect(simSource.voltage).toBe(5)
  expect(simSource.frequency).toBe(60)
  expect(simSource.wave_shape).toBe("sinewave")
  expect(simSource).toMatchInlineSnapshot(`
    {
      "frequency": 60,
      "is_dc_source": false,
      "peak_to_peak_voltage": undefined,
      "phase": undefined,
      "simulation_voltage_source_id": "simulation_voltage_source_0",
      "terminal1_source_port_id": "source_port_0",
      "terminal2_source_port_id": "source_port_1",
      "type": "simulation_voltage_source",
      "voltage": 5,
      "wave_shape": "sinewave",
    }
  `)

  const schComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })!
  expect(schComponent).toBeDefined()
  expect(schComponent.symbol_name).toContain("ac_voltmeter")

  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })
  expect(pcbComponent).toBeUndefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
