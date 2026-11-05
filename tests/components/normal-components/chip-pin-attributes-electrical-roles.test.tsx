import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinAttributes forward explicit electrical pin role flags and requiredVoltageTolerance to source_port", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <chip
        name="U1"
        pinLabels={{
          pin1: "RESET",
          pin2: "DP",
          pin3: "DN",
          pin4: "VDD",
        }}
        pinAttributes={
          {
            RESET: {
              isResetInput: true,
              isMosfetGate: false,
            },
            DP: {
              isUsbDataPositive: true,
            },
            DN: {
              isUsbDataNegative: true,
            },
            VDD: {
              requiresPower: true,
              requiresVoltage: "3.3V",
              requiredVoltageTolerance: "5%",
            },
          } as any
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const sourcePorts = circuit.db.source_port.list() as Array<
    Record<string, unknown>
  >

  const resetPort = sourcePorts.find((p) => p.name === "RESET")!
  expect(resetPort.is_reset_input).toBe(true)
  expect(resetPort.is_mosfet_gate).toBe(false)
  expect(resetPort.is_usb_data_positive).toBeUndefined()

  const dpPort = sourcePorts.find((p) => p.name === "DP")!
  expect(dpPort.is_usb_data_positive).toBe(true)

  const dnPort = sourcePorts.find((p) => p.name === "DN")!
  expect(dnPort.is_usb_data_negative).toBe(true)

  const vddPort = sourcePorts.find((p) => p.name === "VDD")!
  expect(vddPort.requires_voltage).toBe(3.3)
  expect(vddPort.required_voltage_tolerance).toBe(0.05)
})
