import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inline names on disconnected traces are disambiguated without source nets", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board width={30} height={20} schMaxTraceDistance={10}>
      {["A", "B"].map((name, index) => (
        <subcircuit key={name} name={name} schY={index * -4}>
          <resistor name={`R${index * 2 + 1}`} resistance="1k" schX={-3} />
          <resistor name={`R${index * 2 + 2}`} resistance="2k" schX={3} />
          <trace
            from={`R${index * 2 + 1}.pin2`}
            to={`R${index * 2 + 2}.pin1`}
            schDisplayLabel="BUS"
          />
        </subcircuit>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_net.list()).toHaveLength(0)
  const labels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "BUS")
  expect(labels).toHaveLength(2)
  expect(labels.map((label) => label.display_superscript).sort()).toEqual([
    "1",
    "2",
  ])
  expect(
    circuit.db.schematic_text
      .list()
      .filter((text) => !text.source_trace_id)
      .every((text) => text.display_superscript === undefined),
  ).toBe(true)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
