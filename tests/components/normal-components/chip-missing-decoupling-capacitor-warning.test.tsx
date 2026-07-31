import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when a chip power pin does not have a decoupling capacitor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <chip
        name="U_MISSING"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        pinAttributes={{
          VCC: {
            requiresPower: true,
            recommendedDecouplingCapacitorCapacitance: "100nF",
          },
          GND: { requiresGround: true },
        }}
      />
      <trace from=".U_MISSING > .VCC" to="net.VCC_MISSING" />
      <trace from=".U_MISSING > .GND" to="net.GND" />

      <chip
        name="U_WITH_CAP"
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{ GND: { requiresGround: true } }}
      />
      <capacitor name="C1" capacitance="100nF" />
      <trace from=".U_WITH_CAP > .VDD" to=".C1 > .pin1" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".U_WITH_CAP > .GND" to="net.GND" />

      <chip
        name="U_OPT_OUT"
        pinLabels={{ pin1: "VBAT", pin2: "GND" }}
        pinAttributes={{
          VBAT: {
            requiresPower: true,
            shouldHaveDecouplingCapacitor: false,
          },
          GND: { requiresGround: true },
        }}
      />
      <trace from=".U_OPT_OUT > .VBAT" to="net.VBAT" />
      <trace from=".U_OPT_OUT > .GND" to="net.GND" />

      <chip
        name="U_POWER_SOURCE"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        pinAttributes={{
          VCC: { providesPower: true },
          GND: { providesGround: true },
        }}
      />
      <trace from=".U_POWER_SOURCE > .VCC" to="net.VCC_SOURCE" />
      <trace from=".U_POWER_SOURCE > .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const decouplingCapacitorWarnings =
    circuit.db.source_pin_missing_trace_warning
      .list()
      .filter((warning) => warning.message.includes("decoupling capacitor"))

  expect(decouplingCapacitorWarnings).toHaveLength(1)
  expect(decouplingCapacitorWarnings[0]).toMatchObject({
    warning_type: "source_pin_missing_trace_warning",
    message:
      "Power pin VCC on U_MISSING should have a 100nF decoupling capacitor connected to ground",
  })
})
