import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol connections require chipRef", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <schematicsymbol
        name="A"
        symbolName="diode_right"
        connections={{
          pin1: "D1.A",
          pin2: "D1.K",
        }}
      />
    </board>,
  )

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "with connections requires a chipRef",
  )
})
