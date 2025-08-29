import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<voltagesource /> sine and square wave", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <voltagesource
        name="VS1"
        voltage="5V"
        frequency="60Hz"
        waveShape="sinewave"
      />
      <resistor name="R1" resistance="10k" schY={-2} />
      <trace from={".VS1 > .pin1"} to={".R1 > .pin1"} />
      <trace from={".VS1 > .pin2"} to={".R1 > .pin2"} />
      <trace from={".R1 > .pin2"} to="net.GND" />
      <voltagesource
        name="VS2"
        voltage="3.3V"
        frequency="1kHz"
        waveShape="square"
        dutyCycle={0.5}
        schX={3}
      />
      <resistor name="R2" resistance="10k" schX={3} schY={-2} />
      <trace from={".VS2 > .pin1"} to={".R2 > .pin1"} />
      <trace from={".VS2 > .pin2"} to={".R2 > .pin2"} />
      <trace from={".VS2 > .pin2"} to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()
  // Sine Wave Source
  const sourceComponent1 = circuit.db.source_component.getWhere({
    name: "VS1",
  }) as any

  expect(sourceComponent1).toBeDefined()
  expect(sourceComponent1.ftype).toBe("simple_voltage_source")
  expect(sourceComponent1.voltage).toBe(5)
  expect(sourceComponent1.frequency).toBe(60)
  expect(sourceComponent1.wave_shape).toBe("sinewave")

  const simSources = (circuit.db as any).simulation_voltage_source.list()
  const simSource1 = simSources.find((s: any) => s.voltage === 5)
  expect(simSource1).toBeDefined()
  expect(simSource1.is_dc_source).toBe(false)
  expect(simSource1.voltage).toBe(5)
  expect(simSource1.frequency).toBe(60)
  expect(simSource1.wave_shape).toBe("sinewave")

  const schComponent1 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent1.source_component_id,
  })!
  expect(schComponent1).toBeDefined()
  expect(schComponent1.symbol_name).toContain("ac_voltmeter")

  // Square Wave Source
  const sourceComponent2 = circuit.db.source_component.getWhere({
    name: "VS2",
  }) as any

  expect(sourceComponent2).toBeDefined()
  expect(sourceComponent2.ftype).toBe("simple_voltage_source")
  expect(sourceComponent2.voltage).toBe(3.3)
  expect(sourceComponent2.frequency).toBe(1000)
  expect(sourceComponent2.wave_shape).toBe("square")
  expect(sourceComponent2.duty_cycle).toBe(0.5)

  const simSource2 = simSources.find((s: any) => s.voltage === 3.3)
  expect(simSource2).toBeDefined()
  expect(simSource2.is_dc_source).toBe(false)
  expect(simSource2.voltage).toBe(3.3)
  expect(simSource2.frequency).toBe(1000)
  expect(simSource2.wave_shape).toBe("square")
  expect(simSource2.duty_cycle).toBe(0.5)

  const schComponent2 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent2.source_component_id,
  })!
  expect(schComponent2).toBeDefined()
  expect(schComponent2.symbol_name).toContain("square_wave")

  const pcbComponent1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent1.source_component_id,
  })
  expect(pcbComponent1).toBeUndefined()

  const pcbComponent2 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent2.source_component_id,
  })
  expect(pcbComponent2).toBeUndefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
