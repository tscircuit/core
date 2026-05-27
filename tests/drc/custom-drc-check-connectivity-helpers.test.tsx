import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check connectivity helpers accept ports, nets, and components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="14mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "ADDR1",
          pin4: "GND",
        }}
      />
      <resistor name="R_ADDR1" resistance="10k" footprint="0402" pcbY={-5} />

      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U1 > .ADDR1" to=".R_ADDR1 > .pin1" />
      <trace from=".R_ADDR1 > .pin2" to="net.GND" />

      <drccheck
        name="connectivity-helper-check"
        checkFn={({
          select,
          selectAll,
          isConnected,
          isPulledDown,
          getResistanceBetween,
        }) => {
          const [chip] = selectAll("chip")
          const addr1 = select("U1.ADDR1")
          const gnd = select("net.GND")
          if (!chip || !addr1 || !gnd) return

          if (
            isConnected(chip, gnd) &&
            isPulledDown(addr1) &&
            getResistanceBetween(addr1, gnd) === 10_000
          ) {
            return {
              error_type: "source_component_misconfigured_error",
              message: "Connectivity helpers detected ADDR1 pull-down",
              source_component_ids: [
                chip.getSourceComponent()!.source_component_id,
              ],
              source_port_ids: [addr1.getSourcePort()!.source_port_id],
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
        elm.message === "Connectivity helpers detected ADDR1 pull-down",
    )

  expect(customErrors).toHaveLength(1)
})
