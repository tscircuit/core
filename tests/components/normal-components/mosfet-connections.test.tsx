import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mosfet connections prop creates traces for gate, source, and drain", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        connections={{
          gate: "net.GATE",
          source: "net.GND",
          drain: "net.VCC",
        }}
      />
    </board>,
  )

  await circuit.render()

  expect(
    circuit.db.source_trace.list().map((trace) => trace.display_name),
  ).toMatchInlineSnapshot(`
    [
      ".Q1 > .gate to net.GATE",
      ".Q1 > .source to net.GND",
      ".Q1 > .drain to net.VCC",
    ]
  `)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
