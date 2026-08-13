import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic section auto-layout accounts for large title bounds", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="45mm" height="25mm" routingDisabled>
      <schematicsection
        name="soft_power"
        displayName="Soft Power Switch"
        sectionTitleFontSize="0.32in"
      />
      <schematicsection
        name="high_side"
        displayName="High-Side Switch"
        sectionTitleFontSize="0.32in"
      />
      <schematicsection
        name="usb_c"
        displayName="USB-C"
        sectionTitleFontSize="0.32in"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schSectionName="soft_power"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schSectionName="high_side"
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        schSectionName="usb_c"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
