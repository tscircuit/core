import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a pinheader with a cad component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="P1" gender="male" pinCount={4} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cadComponent = circuit.db.cad_component.list()[0]
  expect(cadComponent).toBeDefined()
})
