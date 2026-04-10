import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinAttributes are copied onto source_port records", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "VOUT" }}
        pinAttributes={{
          VCC: { requiresPower: true, mustBeConnected: true },
          GND: { requiresGround: true },
          VOUT: { providesPower: true, providesVoltage: 3.3 },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const getPort = (name: string) =>
    sourcePorts.find((port) => port.name === name)

  expect(getPort("VCC")?.requires_power).toBe(true)
  expect(getPort("VCC")?.must_be_connected).toBe(true)
  expect(getPort("GND")?.requires_ground).toBe(true)
  expect(getPort("VOUT")?.provides_power).toBe(true)
  expect(getPort("VOUT")?.provides_voltage).toBe(3.3)
})
