import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check connectivity helpers accept ports, nets, and components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="14mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        manufacturerPartNumber="STM32F030F4P6"
        pinLabels={{
          pin1: "BOOT0",
          pin2: "NRST",
          pin3: "VDD",
          pin4: "GND",
        }}
      />
      <resistor name="R_BOOT0" resistance="1k" footprint="0402" pcbY={-5} />

      <trace from=".U1 > .VDD" to="net.V3_3" />
      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U1 > .BOOT0" to=".R_BOOT0 > .pin1" />
      <trace from=".R_BOOT0 > .pin2" to="net.GND" />

      <drccheck
        name="stm32-boot0-pulldown-resistance-check"
        checkFn={({
          select,
          selectAll,
          isConnected,
          isPulledDown,
          getResistanceBetween,
        }) => {
          const [chip] = selectAll("chip")
          const boot0 = select("U1.BOOT0")
          const gnd = select("net.GND")
          if (!chip || !boot0 || !gnd) return

          if (
            isConnected(chip, gnd) &&
            isPulledDown(boot0) &&
            getResistanceBetween(boot0, gnd) === 1_000
          ) {
            return {
              error_type: "source_component_misconfigured_error",
              message: "U1 BOOT0 pull-down resistance must be at least 10k",
              source_component_ids: [
                chip.getSourceComponent()!.source_component_id,
              ],
              source_port_ids: [boot0.getSourcePort()!.source_port_id],
            }
          }
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const customErrors = circuit
    .getCircuitJson()
    .filter(
      (elm) =>
        elm.type === "source_component_misconfigured_error" &&
        elm.message === "U1 BOOT0 pull-down resistance must be at least 10k",
    )

  expect(customErrors).toHaveLength(1)
})
