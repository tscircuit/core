import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pushbutton /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <pushbutton name="PB1" footprint="pushbutton" pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_port.list().length).toBe(4)

  expect(circuit.db.schematic_port.list().length).toEqual(4)

  expect(
    [
      ...new Set(circuit.db.source_port.list().flatMap((p) => p.port_hints)),
    ].sort(),
  ).toMatchInlineSnapshot(`
[
  "1",
  "2",
  "3",
  "4",
  "pin1",
  "pin2",
  "pin3",
  "pin4",
  "side1",
  "side2",
]
`)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
