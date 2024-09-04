import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Net } from "lib/components/primitive-components/Net"

it("should create a Net component with correct properties", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <net name="VCC" />
    </board>,
  )

  project.render()

  const net = project.selectOne("net") as Net

  expect(net).not.toBeNull()
  expect(net.props.name).toBe("VCC")
  expect(net.getPortSelector()).toBe("net.VCC")
})
