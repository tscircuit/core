import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "unpopulated pinheader does not emit a fitted CAD model",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="14mm" height="10mm">
        <pinheader
          name="J1"
          pinCount={6}
          pitch="1.27mm"
          holeDiameter="0.7mm"
          platedDiameter="1.1mm"
          gender="unpopulated"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.cad_component.list()).toHaveLength(0)
  },
)
