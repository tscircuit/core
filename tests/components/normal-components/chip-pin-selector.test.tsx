import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("should be able to select a pin/port by label on a chip", () => {
  const { project } = getTestFixture()
  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "PWR", pin8: "GND" }}
      />
    </board>,
  )

  project.render()

  const pwr = project.selectOne(".U1 .PWR")
  expect(pwr).toBeTruthy()
})
