import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * schX/schY are parsed with the `distance` schema, which does not understand
 * `calc(...)` expressions and silently returns `NaN`. Without a guard that NaN
 * propagates into `schematic_component.center` and serializes to `null` in the
 * emitted Circuit JSON with no error. These tests ensure a readable
 * `source_invalid_component_property_error` is emitted and the center stays
 * finite instead.
 */
test("schX calc string emits an error and a finite schematic center", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "IN", pin2: "OUT" }}
        schX={3}
        pcbX={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-6}
        schX="calc(U1.pin1.x - 2mm)"
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  const schXErrors = invalidPropertyErrors.filter(
    (e) => e.property_name === "schX",
  )
  expect(schXErrors.length).toBeGreaterThan(0)

  const message = schXErrors.map((e) => e.message).join("\n")
  expect(message).toContain("Invalid schX value for Resistor")
  expect(message).toContain("calc(U1.pin1.x - 2mm)")

  const resistorSchematic = circuit.db.schematic_component.list().find(
    (c) => c.source_component_id === circuit.db.source_component.list().find((s) => s.name === "R1")?.source_component_id,
  )
  expect(resistorSchematic).toBeDefined()
  expect(Number.isFinite(resistorSchematic!.center.x)).toBe(true)
  expect(Number.isFinite(resistorSchematic!.center.y)).toBe(true)
})

test("schY calc string emits an error and a finite schematic center", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schY="calc(board.maxY - 1mm)"
      />
    </board>,
  )

  circuit.render()

  const schYErrors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((e) => e.property_name === "schY")
  expect(schYErrors.length).toBeGreaterThan(0)
  expect(schYErrors.map((e) => e.message).join("\n")).toContain(
    "Invalid schY value for Resistor",
  )

  const resistorSchematic = circuit.db.schematic_component.list().find(
    (c) =>
      c.source_component_id ===
      circuit.db.source_component.list().find((s) => s.name === "R1")
        ?.source_component_id,
  )
  expect(resistorSchematic).toBeDefined()
  expect(Number.isFinite(resistorSchematic!.center.x)).toBe(true)
  expect(Number.isFinite(resistorSchematic!.center.y)).toBe(true)
})

test("numeric schX/schY do not emit an error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schX={2}
        schY={3}
      />
    </board>,
  )

  circuit.render()

  const schErrors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((e) => e.property_name === "schX" || e.property_name === "schY")
  expect(schErrors.length).toBe(0)

  const resistorSchematic = circuit.db.schematic_component.list().find(
    (c) =>
      c.source_component_id ===
      circuit.db.source_component.list().find((s) => s.name === "R1")
        ?.source_component_id,
  )
  expect(resistorSchematic?.center.x).toBeCloseTo(2)
  expect(resistorSchematic?.center.y).toBeCloseTo(3)
})