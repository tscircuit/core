import { it, expect } from "bun:test"
import { Circuit } from "lib/Circuit"
import { Chip } from "lib/components/normal-components/Chip"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should create a Chip component when using the <bug /> alias", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <bug
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPortArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  project.render()

  const chip = project.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
})
