import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("port forwards hasInversionCircle to schematic_port", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <port
              name="BUBBLED"
              schX={-1}
              schY={0.5}
              direction="left"
              hasInversionCircle
            />
            <port name="PLAIN" schX={-1} schY={0} direction="left" />
            <port
              name="EXPLICIT_FALSE"
              schX={-1}
              schY={-0.5}
              direction="left"
              hasInversionCircle={false}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const schematicPortsByLabel = new Map(
    circuit.db.schematic_port
      .list()
      .map((port) => [port.display_pin_label, port]),
  )

  expect(
    schematicPortsByLabel.get("BUBBLED")?.is_drawn_with_inversion_circle,
  ).toBe(true)

  // Ports that did not request a bubble must not be marked as inverted, so
  // schematics without inversion circles keep their existing serialization.
  expect(
    schematicPortsByLabel.get("PLAIN")?.is_drawn_with_inversion_circle,
  ).toBeUndefined()
  expect(
    schematicPortsByLabel.get("EXPLICIT_FALSE")?.is_drawn_with_inversion_circle,
  ).toBeUndefined()
})
