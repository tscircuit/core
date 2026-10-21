import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol ports exclude extra terminals without hiding genuine missing traces", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <switch
        name="SW1"
        type="spst"
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
            <schematictext text="pin3" schX={-1} schY={0.4} fontSize={0.18} />
            <schematictext text="pin7" schX={1} schY={0.4} fontSize={0.18} />
          </symbol>
        }
        noConnect={["pin3"]}
      />
      <schematictext
        text="SW1: custom TSX symbol declares only pins 3 and 7"
        schY={2.1}
        fontSize={0.2}
      />
      <schematictext
        text="Pin3 marked NC; pin7 left open on purpose"
        schY={0.25}
        fontSize={0.2}
      />
      <switch name="SW2" type="spst" schY={-1} noConnect={["pin1", "pin2"]} />
      <schematictext
        text="SW2: built-in symbol keeps pins 1 and 2 (both NC)"
        schY={-1.8}
        fontSize={0.2}
      />
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

  const board = circuit.firstChild as Board
  board.add(
    <schematictext
      text={`Only warning: ${warnings[0]!.message}`}
      schY={-2.6}
      fontSize={0.2}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1000,
    height: 700,
  })
})
