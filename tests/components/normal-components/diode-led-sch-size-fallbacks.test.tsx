import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("compact diode size respects shorthand variants, explicit symbols, and unsupported families", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm">
      <diode name="D_DEFAULT" schX={0} schY={6} />
      <diode name="D_MD" schSize="md" schX={3} schY={6} />
      <diode name="D_NAMED_DEFAULT" schSize="default" schX={6} schY={6} />
      <led name="LED_DEFAULT" schSize="default" schX={9} schY={6} />
      <diode name="D_AVALANCHE" avalanche schSize="sm" schX={0} schY={3} />
      <diode
        name="D_ZENER"
        zener
        schSize="xs"
        schRotation={90}
        schX={3}
        schY={3}
      />
      <diode
        name="D_EXPLICIT"
        symbolName="zener_diode"
        schSize="sm"
        schX={6}
        schY={3}
      />
      <diode
        name="D_SIZED"
        symbolName="diode_xs"
        schSize="sm"
        schX={9}
        schY={3}
      />
      <diode name="D_SCHOTTKY" schottky schSize="sm" schX={0} schY={0} />
      <diode name="D_PHOTO" photo schSize="xs" schX={3} schY={0} />
      <led name="LED_LASER" laser schSize="sm" schX={6} schY={0} />
      <led
        name="LED_EXPLICIT"
        symbolName="laser_diode"
        schSize="xs"
        schX={9}
        schY={0}
      />
    </board>,
  )
  circuit.render()
  expect(
    circuit.db.schematic_component.list().map(({ symbol_name }) => symbol_name),
  ).toEqual([
    "diode_right",
    "diode_right",
    "diode_right",
    "led_right",
    "avalanche_diode_sm_right",
    "zener_diode_xs_up",
    "zener_diode_sm_right",
    "diode_xs_right",
    "schottky_diode_right",
    "photodiode_horz",
    "laser_diode_right",
    "laser_diode_right",
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
