import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic symbol rotation not a multiple of 90", () => {
  const { project } = getTestFixture()

  try {
    project.add(
      <board width="10mm" height="10mm">
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          schRotation={45}
        />
      </board>,
    )
  } catch (e: any) {
    expect(e).toBeInstanceOf(Error)
    expect(e.message).toMatch(
      "Schematic rotation 45 is not supported for Capacitor",
    )
  }
})
