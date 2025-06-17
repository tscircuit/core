import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solderjumper symbol selection from props and footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      {/* Props only */}
      <solderjumper name="SJ1" pinCount={2} bridgedPins={[["1", "2"]]} />
      {/* Footprint only */}
      <solderjumper name="SJ2" footprint="solderjumper3_bridged23" />
      {/* Props override footprint */}
      <solderjumper
        name="SJ3"
        footprint="solderjumper3"
        pinCount={3}
        bridgedPins={[["1", "2"]]}
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
})
