import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("power and ground aliases are detected after underscores", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <net name="MCU_VSYS" />
      <net name="USB_VBUS" />
      <net name="CORE_VCC" />
      <net name="IO_VDD" />
      <net name="ANALOG_3V3" />

      <net name="USB_GND" />
      <net name="SENSOR_AGND" />
      <net name="CORE_DGND" />
      <net name="MOTOR_PGND" />
      <net name="LOGIC_VSS" />

      <net name="MCU_VSYS_DISABLED" isPowerNet={false} />
      <net name="USB_GND_DISABLED" isGroundNet={false} />
    </board>,
  )

  project.render()

  const sourceNetsByName = new Map(
    project.db.source_net
      .list()
      .map((sourceNet) => [sourceNet.name, sourceNet]),
  )

  for (const powerNetName of [
    "MCU_VSYS",
    "USB_VBUS",
    "CORE_VCC",
    "IO_VDD",
    "ANALOG_3V3",
  ]) {
    expect(sourceNetsByName.get(powerNetName)?.is_power).toBe(true)
    expect(sourceNetsByName.get(powerNetName)?.is_ground).toBe(false)
  }

  for (const groundNetName of [
    "USB_GND",
    "SENSOR_AGND",
    "CORE_DGND",
    "MOTOR_PGND",
    "LOGIC_VSS",
  ]) {
    expect(sourceNetsByName.get(groundNetName)?.is_ground).toBe(true)
    expect(sourceNetsByName.get(groundNetName)?.is_power).toBe(false)
  }

  expect(sourceNetsByName.get("MCU_VSYS_DISABLED")?.is_power).toBe(false)
  expect(sourceNetsByName.get("USB_GND_DISABLED")?.is_ground).toBe(false)
})
