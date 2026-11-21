import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton warns when the datasheet disagrees with the footprint's default internal connections", async () => {
  // This part ties pin1-pin3 and pin2-pin4, unlike footprinter's "pushbutton"
  // default of pin1-pin2 and pin3-pin4.
  const imported: AnyCircuitElement[] = [
    {
      type: "source_component",
      ftype: "simple_chip",
      source_component_id: "supplier",
      name: "SW1",
      manufacturer_part_number: "COLUMN-TIED-SWITCH",
      internally_connected_source_port_ids: [
        ["supplier1", "supplier3"],
        ["supplier2", "supplier4"],
      ],
    },
    ...[1, 2, 3, 4].map((pinNumber) => ({
      type: "source_port" as const,
      source_component_id: "supplier",
      source_port_id: `supplier${pinNumber}`,
      name: `pin${pinNumber}`,
      pin_number: pinNumber,
      port_hints: [String(pinNumber)],
    })),
  ]
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => imported,
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={12} partsEngine={partsEngine} routingDisabled>
      <pushbutton
        name="SW1"
        manufacturerPartNumber="COLUMN-TIED-SWITCH"
        footprint="pushbutton"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const messages = circuit.db.source_component_pins_underspecified_warning
    .list()
    .map((warning) => warning.message)
  expect(messages).toHaveLength(1)
  expect(messages[0]).toContain(
    'The datasheet reports pins pin1 and pin3 are internally connected, but the internallyConnectedPins prop isn\'t set on pushbutton "SW1"',
  )
  expect(messages[0]).toContain("pins pin2 and pin4 are internally connected")
})
