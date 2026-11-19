import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicitly absent pin requirements clear missing power and ground warnings", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <chip
        name="U1"
        schX={-2}
        pinLabels={{ pin1: "A", pin2: "B" }}
        pinAttributes={{
          pin1: { requiresPower: false, requiresGround: false },
          pin2: { requiresPower: false, requiresGround: false },
        }}
      />
      <chip name="U2" schX={2} pinLabels={{ pin1: "VDD", pin2: "GND" }} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect({
    power: circuit.db.source_no_power_pin_defined_warning
      .list()
      .map(({ message }) => message),
    ground: circuit.db.source_no_ground_pin_defined_warning
      .list()
      .map(({ message }) => message),
  }).toMatchInlineSnapshot(`
    {
      "ground": [
        "U2 has no pin with requires_ground=true",
      ],
      "power": [
        "U2 has no pin with requires_power=true",
      ],
    }
  `)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
