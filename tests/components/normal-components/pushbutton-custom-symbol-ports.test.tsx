import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton with custom symbol only creates custom symbol ports without crashing", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <pushbutton
        name="SW1"
        schY={1}
        symbol={
          <symbol>
            <schematicrect width={1.2} height={0.5} strokeWidth={0.03} />
            <port
              name="pin3"
              pinNumber={3}
              direction="left"
              schX={-1}
              schY={0}
              schStemLength={0.4}
            />
            <port
              name="pin7"
              pinNumber={7}
              direction="right"
              schX={1}
              schY={0}
              schStemLength={0.4}
            />
          </symbol>
        }
        noConnect={["pin3"]}
      />
      <pushbutton name="SW2" schY={-1} noConnect={["pin1", "pin2"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const [name, expectedPins] of [
    ["SW1", [3, 7]],
    ["SW2", [1, 2]],
  ] as const) {
    const component = circuit.db.source_component
      .list()
      .find((c) => c.name === name)!
    const pins = circuit.db.source_port
      .list()
      .filter(
        (port) => port.source_component_id === component.source_component_id,
      )
      .map((port) => port.pin_number)
      .sort((a, b) => a! - b!)
    expect(pins).toEqual([...expectedPins])
  }

  const warnings = circuit.db.source_pin_missing_trace_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toBe("Port pin7 on SW1 is missing a trace")

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1000,
    height: 700,
  })
})
