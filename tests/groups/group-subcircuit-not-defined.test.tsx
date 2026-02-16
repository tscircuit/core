import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit_id not defined when group is not a subcircuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <group>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-2}
          pcbY={0}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const source_group = circuit.db.source_group.list()[0]
  expect(source_group.subcircuit_id).toBeUndefined()
})
