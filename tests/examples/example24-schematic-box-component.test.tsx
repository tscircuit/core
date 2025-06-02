import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Chip with pinrow footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint={"soic8"} />
      <schematicbox schX={0} schY={0} />
    </board>,
  )
  console.log(
    circuit
      .getCircuitJson()
      .filter((el) => el.type === "source_failed_to_create_component_error"),
  )
  circuit.render()
})
