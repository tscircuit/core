import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Reproduction for issue #3520:
 * schematicsymbol schRotation is ignored for oriented native symbols.
 *
 * <schematicsymbol symbolName="opamp_with_power_left" schRotation={180} />
 * should geometrically rotate the symbol and its ports by 180 degrees
 * (inverting the input/power rail positions).
 *
 * Currently on main, the symbol name is rewritten to "opamp_with_power_right"
 * and rendered unrotated without geometric inversion of the ports.
 */
test("repro: schematicsymbol schRotation ignored for oriented symbols (#3520)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U"
        pinLabels={{
          pin1: "IN_PLUS",
          pin2: "IN_MINUS",
          pin3: "V_MINUS",
          pin4: "OUT",
          pin5: "V_PLUS",
        }}
        noSchematicRepresentation
      />
      <schematicsymbol
        name="U1"
        chipRef=".U"
        symbolName="opamp_with_power_left"
        schRotation={180}
        connections={{
          inp1: "U.IN_PLUS",
          inp2: "U.IN_MINUS",
          out: "U.OUT",
          "V-": "U.V_PLUS",
          "V+": "U.V_MINUS",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Capture current behavior on main:
  // symbolName is rewritten to opamp_with_power_right
  const components = circuit.db.schematic_component.list()
  expect(components).toHaveLength(1)
  expect(components[0].symbol_name).toBe("opamp_with_power_right")

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
