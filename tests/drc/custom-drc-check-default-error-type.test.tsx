import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check defaults missing error_type to source_component_misconfigured_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
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

      <trace from=".U1 > .VDD" to="net.V3_3" />
      <trace from=".U1 > .GND" to="net.GND" />

      <drccheck
        name="mcu-reset-pullup-check"
        checkFn={({ selectAll, isPulledUp }) => {
          const [chip] = selectAll("chip")
          const reset = chip?.getPort("NRST")
          if (!chip) return
          if (!reset) return
          if (isPulledUp(reset)) return

          return {
            message: "U1 NRST must have an external pull-up",
            source_component_ids: [
              chip.getSourceComponent()!.source_component_id,
            ],
            source_port_ids: [reset.getSourcePort()!.source_port_id],
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
        elm.message === "U1 NRST must have an external pull-up",
    )

  expect(customErrors).toHaveLength(1)
  expect(customErrors[0]).toMatchObject({
    error_type: "source_component_misconfigured_error",
  })
})
