import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<inductor /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <inductor
        name="U1"
        inductance="10"
        footprint="axial_p0.3in"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("<inductor /> carries maxCurrentRating into source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="10mm" routingDisabled>
      <inductor name="L1" inductance="10uH" footprint="0402" schX={-6} />
      <inductor
        name="L2"
        inductance="10uH"
        maxCurrentRating="2A"
        footprint="0402"
        schX={-2}
      />
      <inductor
        name="L3"
        inductance="10uH"
        maxCurrentRating={0.5}
        footprint="0402"
        schX={2}
      />
      <inductor
        name="L4"
        inductance="10uH"
        maxCurrentRating="500mA"
        footprint="0402"
        schX={6}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const ratingByName = Object.fromEntries(
    circuit
      .getCircuitJson()
      .filter((e: any) => e.type === "source_component")
      .map((e: any) => [e.name, e.max_current_rating]),
  )

  // `max_current_rating` exists on the simple_inductor schema; the prop used to
  // be dropped entirely.
  expect(ratingByName.L1).toBeUndefined()
  expect(ratingByName.L2).toBe(2)
  expect(ratingByName.L3).toBe(0.5)
  // The unit prefix has to be honoured — "500mA" is 0.5A, not 500A.
  expect(ratingByName.L4).toBe(0.5)
})
