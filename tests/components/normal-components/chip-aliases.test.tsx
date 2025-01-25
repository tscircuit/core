import { it, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Chip } from "lib/components/normal-components/Chip"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should create a Chip component when using the <bug /> alias", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
})
