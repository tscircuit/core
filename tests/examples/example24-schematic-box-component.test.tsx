import { test } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Chip with pinrow footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint={"soic8"} />
      <chip name="U2" footprint={"soic8"} schX={2} />
      <schematicbox
        paddingRight={0.2}
        paddingLeft={0.2}
        strokeStyle="dashed"
        schX={0}
        schY={0}
      />
    </board>,
  )

  circuit.render()
})
