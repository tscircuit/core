import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("voltage source displays voltage and frequency with different rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      {/* Voltage source at 0 degrees (default) */}
      <voltagesource
        name="V1"
        voltage="5V"
        frequency="60Hz"
        waveShape="sinewave"
        schX={0}
        schY={0}
      />

      {/* Voltage source at 90 degrees */}
      <voltagesource
        name="V2"
        voltage="3.3V"
        frequency="1kHz"
        waveShape="sinewave"
        schX={4}
        schY={0}
        schRotation={90}
      />

      {/* Voltage source at 180 degrees */}
      <voltagesource
        name="V3"
        voltage="12V"
        frequency="50Hz"
        waveShape="sinewave"
        schX={0}
        schY={-4}
        schRotation={180}
      />

      {/* Voltage source at 270 degrees */}
      <voltagesource
        name="V4"
        voltage="24V"
        frequency="2kHz"
        waveShape="sinewave"
        schX={4}
        schY={-4}
        schRotation={270}
      />

      {/* Square wave voltage source */}
      <voltagesource
        name="V5"
        voltage="5V"
        frequency="100Hz"
        waveShape="square"
        schX={8}
        schY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent1 = circuit.db.source_component.getWhere({
    name: "V1",
  }) as any
  expect(sourceComponent1).toBeDefined()

  const schComponent1 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent1.source_component_id,
  })
  expect(schComponent1).toBeDefined()
  expect(schComponent1!.symbol_display_value).toBe("5V 60Hz")

  const sourceComponent2 = circuit.db.source_component.getWhere({
    name: "V2",
  }) as any
  expect(sourceComponent2).toBeDefined()

  const schComponent2 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent2.source_component_id,
  })
  expect(schComponent2).toBeDefined()
  expect(schComponent2!.symbol_display_value).toBe("3.3V 1kHz")

  const sourceComponent3 = circuit.db.source_component.getWhere({
    name: "V3",
  }) as any
  expect(sourceComponent3).toBeDefined()

  const schComponent3 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent3.source_component_id,
  })
  expect(schComponent3).toBeDefined()
  expect(schComponent3!.symbol_display_value).toBe("12V 50Hz")

  const sourceComponent4 = circuit.db.source_component.getWhere({
    name: "V4",
  }) as any
  expect(sourceComponent4).toBeDefined()

  const schComponent4 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent4.source_component_id,
  })
  expect(schComponent4).toBeDefined()
  expect(schComponent4!.symbol_display_value).toBe("24V 2kHz")

  const sourceComponent5 = circuit.db.source_component.getWhere({
    name: "V5",
  }) as any
  expect(sourceComponent5).toBeDefined()

  const schComponent5 = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent5.source_component_id,
  })
  expect(schComponent5).toBeDefined()
  expect(schComponent5!.symbol_display_value).toBe("5V 100Hz")
  expect(schComponent5!.symbol_name).toContain("square_wave")

  const voltageSources = circuit.db.source_component
    .list()
    .filter((sc: any) => sc.ftype === "simple_voltage_source")
  expect(voltageSources).toHaveLength(5)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
