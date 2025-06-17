import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solderjumper symbol selection from props and footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="12mm">
      {/* Props only */}
      <solderjumper
        name="SJ1"
        pinCount={2}
        bridgedPins={[["1", "2"]]}
        pcbX={-9}
        schX={-4}
      />
      {/* Footprint only */}
      <solderjumper
        name="SJ2"
        footprint="solderjumper3_bridged23"
        pcbX={-3}
        schX={-2}
      />
      {/* Props override footprint */}
      <solderjumper
        name="SJ3"
        footprint="solderjumper3"
        pinCount={3}
        bridgedPins={[["1", "2"]]}
        pcbX={3}
        schX={0}
      />
      {/* Props override both pinCount and bridgedPins */}
      <solderjumper
        name="SJ4"
        footprint="solderjumper3_bridged23"
        pinCount={2}
        bridgedPins={[["1", "2"]]}
        pcbX={9}
        schX={2}
      />
      {/* Bridged pins override footprint only */}
      <solderjumper
        name="SJ5"
        footprint="solderjumper3_bridged23"
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        pcbX={15}
        schX={4}
      />
      {/* Pin count overrides footprint only */}
      <solderjumper
        name="SJ6"
        footprint="solderjumper3_bridged23"
        pinCount={3}
        pcbX={21}
        schX={6}
      />
    </board>,
  )

  circuit.render()

  const symbols = circuit.db.schematic_component
    .list()
    .filter((c) => c.symbol_name?.startsWith("solderjumper"))
    .map((c) =>
      (c.symbol_name ?? "").replace(/_(right|left|up|down|horz|vert)$/, ""),
    )

  expect(symbols).toContain("solderjumper2_bridged12")
  expect(symbols).toContain("solderjumper3_bridged23")
  expect(symbols).toContain("solderjumper3_bridged12")
  expect(symbols).toContain("solderjumper3_bridged123")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
