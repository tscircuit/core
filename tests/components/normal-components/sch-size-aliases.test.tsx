import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schSize accepts 'small' and 'extra_small' aliases for passives, diodes, and LEDs (fixes #3108)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      {/* Standalone issue #3108 repro: capacitor schSize='small' vs default */}
      <capacitor
        name="C_DEFAULT"
        capacitance="100nF"
        footprint="0402"
        schX={0}
        schY={0}
      />
      <capacitor
        name="C_SMALL"
        capacitance="100nF"
        footprint="0402"
        schSize="small"
        schX={3}
        schY={0}
      />
      <capacitor
        name="C_EXTRA_SMALL"
        capacitance="100nF"
        footprint="0402"
        schSize="extra_small"
        schX={6}
        schY={0}
      />

      {/* Resistor aliases */}
      <resistor name="R_DEFAULT" resistance="10k" schX={0} schY={3} />
      <resistor
        name="R_SMALL"
        resistance="10k"
        schSize="small"
        schX={3}
        schY={3}
      />
      <resistor
        name="R_EXTRA_SMALL"
        resistance="10k"
        schSize="extra_small"
        schX={6}
        schY={3}
      />

      {/* Diode and LED aliases */}
      <diode name="D_SMALL" schSize="small" schX={0} schY={6} />
      <diode name="D_EXTRA_SMALL" schSize="extra_small" schX={3} schY={6} />
      <led name="LED_SMALL" schSize="small" schX={6} schY={6} />
      <led name="LED_EXTRA_SMALL" schSize="extra_small" schX={9} schY={6} />
    </board>,
  )

  circuit.render()

  const schematicComponents = circuit.db.schematic_component.list()

  expect(schematicComponents.map(({ symbol_name }) => symbol_name)).toEqual([
    "capacitor_right",
    "capacitor_sm_right",
    "capacitor_xs_right",
    "boxresistor_right",
    "boxresistor_sm_right",
    "boxresistor_xs_right",
    "diode_sm_right",
    "diode_xs_right",
    "led_sm_right",
    "led_xs_right",
  ])

  // Verify pin span for C_DEFAULT vs C_SMALL
  const cDefault = schematicComponents.find(
    (c) =>
      circuit.db.source_component.get(c.source_component_id!)?.name ===
      "C_DEFAULT",
  )!
  const cSmall = schematicComponents.find(
    (c) =>
      circuit.db.source_component.get(c.source_component_id!)?.name ===
      "C_SMALL",
  )!

  const cDefaultPorts = circuit.db.schematic_port
    .list()
    .filter((p) => p.schematic_component_id === cDefault.schematic_component_id)
  const cSmallPorts = circuit.db.schematic_port
    .list()
    .filter((p) => p.schematic_component_id === cSmall.schematic_component_id)

  const cDefaultSpan = Math.hypot(
    cDefaultPorts[1]!.center.x - cDefaultPorts[0]!.center.x,
    cDefaultPorts[1]!.center.y - cDefaultPorts[0]!.center.y,
  )
  const cSmallSpan = Math.hypot(
    cSmallPorts[1]!.center.x - cSmallPorts[0]!.center.x,
    cSmallPorts[1]!.center.y - cSmallPorts[0]!.center.y,
  )

  // Default capacitor pin span is 0.6, compact "small"/"sm" span is 0.5
  expect(cDefaultSpan).toBeCloseTo(0.6, 5)
  expect(cSmallSpan).toBeCloseTo(0.5, 5)
  expect(cSmallSpan).toBeLessThan(cDefaultSpan)
})
