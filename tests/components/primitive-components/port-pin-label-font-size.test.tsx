import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("port forwards schematic pin-label font sizes to circuit json", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <port
              name="SMALL"
              schX={-1}
              schY={0.5}
              direction="left"
              schPinLabelFontSize="sm"
            />
            <port
              name="CUSTOM"
              schX={-1}
              schY={0}
              direction="left"
              schPinLabelFontSize="0.1mm"
            />
            <port
              name="DEFAULT"
              schX={-1}
              schY={-0.5}
              direction="left"
              schPinLabelFontSize="default"
            />
            <port name="UNCHANGED" schX={-1} schY={-1} direction="left" />
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

  expect(schematicPortsByLabel.get("SMALL")?.display_pin_label_font_size).toBe(
    0.12,
  )
  expect(schematicPortsByLabel.get("CUSTOM")?.display_pin_label_font_size).toBe(
    0.1,
  )
  expect(
    schematicPortsByLabel.get("DEFAULT")?.display_pin_label_font_size,
  ).toBeUndefined()
  expect(
    schematicPortsByLabel.get("UNCHANGED")?.display_pin_label_font_size,
  ).toBeUndefined()
})
