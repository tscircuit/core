import { test, expect } from "bun:test"
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

test("<inductor /> with SI unit inductance string (10uH) emits numeric henries (fixes #3111)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <inductor
        name="L1"
        inductance="10uH"
        footprint="axial_p0.3in"
      />
    </board>,
  )

  circuit.render()

  const inductor = circuit.db.source_component.getWhere({ name: "L1" }) as any
  expect(inductor.ftype).toBe("simple_inductor")
  expect(typeof inductor.inductance).toBe("number")
  expect(inductor.inductance).toBeCloseTo(0.00001, 7)
  expect(inductor.display_inductance).toBe("10µH")
})
