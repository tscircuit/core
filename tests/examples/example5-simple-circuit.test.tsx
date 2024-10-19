import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example 5: simple circuit with capacitor, resistor, and pushbutton", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="20mm" height="20mm" schAutoLayoutEnabled>
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0805"
        pcbX={0}
        pcbY={5}
      />
      <resistor name="R1" resistance="10k" footprint="0603" pcbX={5} pcbY={0} />
      <chip name="SW1" footprint="pushbutton" pcbX={-5} pcbY={0} />
      <net name="VCC" />
      <net name="GND" />

      <trace from="net.VCC" to=".C1 > .pin1" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from="net.VCC" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".SW1 > .pin1" />
      <trace from=".SW1 > .pin2" to="net.GND" />
    </board>,
  )

  project.render()

  // Check if all components are created
  expect(project.selectOne("capacitor")).not.toBeNull()
  expect(project.selectOne("resistor")).not.toBeNull()
  expect(project.selectOne("chip[name='SW1']")).not.toBeNull()

  // Check if nets are created
  expect(project.selectOne("net[name='VCC']")).not.toBeNull()
  expect(project.selectOne("net[name='GND']")).not.toBeNull()

  // Check if traces are created
  expect(project.selectAll("trace").length).toBe(5)

  // Generate and check PCB snapshot
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
