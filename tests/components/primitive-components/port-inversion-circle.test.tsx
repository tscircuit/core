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

  // Snapshot the persisted field rather than the rendered schematic: drawing
  // the bubble is circuit-to-svg's responsibility, and it does not yet render
  // ports for symbol-based components.
  expect(
    circuit.db.schematic_port.list().map((port) => ({
      label: port.display_pin_label,
      is_drawn_with_inversion_circle: port.is_drawn_with_inversion_circle,
    })),
  ).toMatchInlineSnapshot(`
    [
      {
        "is_drawn_with_inversion_circle": true,
        "label": "BUBBLED",
      },
      {
        "is_drawn_with_inversion_circle": undefined,
        "label": "PLAIN",
      },
      {
        "is_drawn_with_inversion_circle": undefined,
        "label": "EXPLICIT_FALSE",
      },
    ]
  `)
})
