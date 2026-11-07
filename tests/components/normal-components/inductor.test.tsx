import { test, expect } from "bun:test"
import { any_circuit_element, type SourceSimpleInductor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<inductor /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <inductor
        name="U1"
        inductance="10"
        maxCurrentRating="2A"
        footprint="axial_p0.3in"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_component.getWhere({ name: "U1" })).toMatchObject({
    ftype: "simple_inductor",
    inductance: 10,
    max_current_rating: 2,
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("<inductor /> parses SI unit string inductance into numeric henries", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <inductor name="L1" inductance="10uH" footprint="0402" />
    </board>,
  )

  circuit.render()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "L1",
  }) as SourceSimpleInductor
  expect(sourceComponent).toMatchObject({
    ftype: "simple_inductor",
    display_inductance: "10µH",
  })
  expect(typeof sourceComponent.inductance).toBe("number")
  expect(sourceComponent.inductance).toBeCloseTo(0.00001, 10)
  expect(any_circuit_element.safeParse(sourceComponent).success).toBe(true)
})
