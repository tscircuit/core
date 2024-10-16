import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with multiple pins having the same label", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic16"
        pinLabels={{
          pin1: "VCC",
          pin4: "GND",
          pin8: "GND",
          pin12: "OUT",
          pin16: "GND"
        }}
      />
    </board>
  )

  project.render()

  const chip = project.selectOne("chip")
  expect(chip).not.toBeNull()

  const gndPorts = project.selectAll(".U1 .GND")
  expect(gndPorts.length).toBe(3)

  const gndPinNumbers = gndPorts.map(port => port.props.pinNumber).sort()
  expect(gndPinNumbers).toEqual([4, 8, 16])

  const vccPort = project.selectOne(".U1 .VCC")
  expect(vccPort).not.toBeNull()
  expect(vccPort!.props.pinNumber).toBe(1)

  const outPort = project.selectOne(".U1 .OUT")
  expect(outPort).not.toBeNull()
  expect(outPort!.props.pinNumber).toBe(12)
})
