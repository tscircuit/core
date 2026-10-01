import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("MCU firmware choices and pin roles survive real TSX source rendering", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="12mm">
      <chip
        name="U1"
        footprint="soic8"
        firmwareRtos="nortos"
        firmwareLfClockSource="internal_rc"
        pinLabels={{
          pin1: "ENABLE",
          pin2: "INTERRUPT",
          pin3: "SCL",
          pin4: "DEBUG",
        }}
        pinAttributes={{
          ENABLE: {
            isGpio: true,
            isOutput: true,
            isInput: false,
            isUsingPushPull: true,
            initialOutputState: "low",
          },
          INTERRUPT: {
            isGpio: true,
            isInput: true,
            interruptTrigger: "falling",
            isUsingInternalPullup: false,
            isUsingInternalPulldown: false,
          },
          SCL: {
            activeCapability: "i2c_scl",
            i2cMaxBitRate: "100kbps",
            isUsingOpenDrain: true,
          },
          DEBUG: {
            doNotConfigure: true,
            canUseTriState: true,
            isUsingTriState: false,
          },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.list().find((chip) => chip.name === "U1"),
  ).toMatchObject({
    firmware_rtos: "nortos",
    firmware_lf_clock_source: "internal_rc",
  })
  const ports = circuit.db.source_port.list()
  expect(ports.find((port) => port.name === "ENABLE")).toMatchObject({
    is_gpio: true,
    is_input: false,
    is_output: true,
    is_using_push_pull: true,
    initial_output_state: "low",
  })
  expect(ports.find((port) => port.name === "INTERRUPT")).toMatchObject({
    is_input: true,
    interrupt_trigger: "falling",
    is_using_internal_pullup: false,
    is_using_internal_pulldown: false,
  })
  expect(ports.find((port) => port.name === "SCL")).toMatchObject({
    is_configured_for_i2c_scl: true,
    i2c_max_bit_rate: 100000,
    is_using_open_drain: true,
  })
  expect(ports.find((port) => port.name === "DEBUG")).toMatchObject({
    do_not_configure: true,
    can_use_tri_state: true,
    is_using_tri_state: false,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
