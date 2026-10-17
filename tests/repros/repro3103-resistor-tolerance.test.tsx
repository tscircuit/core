import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor preserves tolerance in Circuit JSON source_component (#3103)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        tolerance="5%"
        footprint="0402"
        pcbX={-2}
      />
      <resistor
        name="R2"
        resistance="10k"
        tolerance={0.01}
        footprint="0402"
        pcbX={2}
      />
      <resistor name="R3" resistance="4.7k" footprint="0402" pcbY={3} />
    </board>,
  )

  circuit.render()

  const r1 = circuit.db.source_component.list().find((c) => c.name === "R1") as
    | Record<string, unknown>
    | undefined
  const r2 = circuit.db.source_component.list().find((c) => c.name === "R2") as
    | Record<string, unknown>
    | undefined
  const r3 = circuit.db.source_component.list().find((c) => c.name === "R3") as
    | Record<string, unknown>
    | undefined

  expect(r1?.ftype).toBe("simple_resistor")
  expect(r1?.tolerance).toBe(0.05)

  expect(r2?.ftype).toBe("simple_resistor")
  expect(r2?.tolerance).toBe(0.01)

  expect(r3?.ftype).toBe("simple_resistor")
  expect(r3?.tolerance).toBeUndefined()
})
