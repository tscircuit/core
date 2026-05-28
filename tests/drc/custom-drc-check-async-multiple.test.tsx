import { expect, test } from "bun:test"
import type { SourceComponentMisconfiguredError } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check supports async functions and multiple diagnostics", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        manufacturerPartNumber="TMP117"
        pinLabels={{
          pin1: "ADDR1",
          pin3: "SDA",
          pin4: "GND",
          pin5: "SCL",
          pin8: "VCC",
        }}
        pcbX={-3}
      />
      <chip
        name="U2"
        footprint="soic8"
        manufacturerPartNumber="TMP117"
        pinLabels={{
          pin1: "ADDR1",
          pin3: "SDA",
          pin4: "GND",
          pin5: "SCL",
          pin8: "VCC",
        }}
        pcbX={3}
      />

      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".U2 > .VCC" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U2 > .GND" to="net.GND" />
      <trace from=".U1 > .SDA" to="net.SDA" />
      <trace from=".U2 > .SDA" to="net.SDA" />
      <trace from=".U1 > .SCL" to="net.SCL" />
      <trace from=".U2 > .SCL" to="net.SCL" />

      <drccheck
        name="tmp117-addr1-floating-check"
        checkFn={async ({ selectAll, isPulledDown, isPulledUp }) => {
          const chips = selectAll("chip[manufacturerPartNumber='TMP117']")

          return chips.flatMap((chip) => {
            const addr1 = chip.getPort("ADDR1")
            const sourceComponent = chip.getSourceComponent()
            if (!addr1 || !sourceComponent) return []
            if (isPulledDown(addr1) || isPulledUp(addr1)) return []

            return [
              {
                error_type: "source_component_misconfigured_error",
                message: `${sourceComponent.name} ADDR1 must be tied high or low`,
                source_component_ids: [sourceComponent.source_component_id],
                source_port_ids: [addr1.getSourcePort()!.source_port_id],
              },
            ]
          })
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
        elm.message.endsWith("ADDR1 must be tied high or low"),
    ) as SourceComponentMisconfiguredError[]

  expect(customErrors).toHaveLength(2)
  expect(customErrors.map((error) => error.message).sort()).toEqual([
    "U1 ADDR1 must be tied high or low",
    "U2 ADDR1 must be tied high or low",
  ])
  expect(
    customErrors.every((error) => error.source_component_ids.length === 1),
  ).toBe(true)
})
