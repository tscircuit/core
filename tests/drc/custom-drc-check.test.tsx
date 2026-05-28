import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check can emit source_component_misconfigured_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="35mm" height="22mm" routingDisabled>
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
        pcbX={-8}
        pcbY={0}
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
        pcbX={8}
        pcbY={0}
      />
      <resistor
        name="R_ADDR1_U1"
        resistance="10k"
        footprint="0402"
        pcbX={-8}
        pcbY={-8}
      />
      <resistor
        name="R_ADDR1_U2"
        resistance="10k"
        footprint="0402"
        pcbX={8}
        pcbY={-8}
      />

      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".U2 > .VCC" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U2 > .GND" to="net.GND" />
      <trace from=".U1 > .SDA" to="net.SDA" />
      <trace from=".U2 > .SDA" to="net.SDA" />
      <trace from=".U1 > .SCL" to="net.SCL" />
      <trace from=".U2 > .SCL" to="net.SCL" />
      <trace from=".U1 > .ADDR1" to=".R_ADDR1_U1 > .pin1" />
      <trace from=".R_ADDR1_U1 > .pin2" to="net.GND" />
      <trace from=".U2 > .ADDR1" to=".R_ADDR1_U2 > .pin1" />
      <trace from=".R_ADDR1_U2 > .pin2" to="net.GND" />

      <drccheck
        name="tmp117-i2c-address-conflict"
        checkFn={({ selectAll, isConnected, isPulledDown }) => {
          const chips = selectAll("chip[manufacturerPartNumber='TMP117']")
          const [chipA, chipB] = chips
          if (!chipA || !chipB) return

          const aSda = chipA.getPort("SDA")
          const bSda = chipB.getPort("SDA")
          const aScl = chipA.getPort("SCL")
          const bScl = chipB.getPort("SCL")
          const aAddr1 = chipA.getPort("ADDR1")
          const bAddr1 = chipB.getPort("ADDR1")
          if (!aSda || !bSda || !aScl || !bScl || !aAddr1 || !bAddr1) return

          if (
            isConnected(aSda, bSda) &&
            isConnected(aScl, bScl) &&
            isPulledDown(aAddr1) &&
            isPulledDown(bAddr1)
          ) {
            return {
              error_type: "source_component_misconfigured_error",
              message: "Two TMP117 chips share the same I2C address",
              source_component_ids: [
                chipA.getSourceComponent()!.source_component_id,
                chipB.getSourceComponent()!.source_component_id,
              ],
              source_port_ids: [
                aSda.getSourcePort()!.source_port_id,
                bSda.getSourcePort()!.source_port_id,
                aScl.getSourcePort()!.source_port_id,
                bScl.getSourcePort()!.source_port_id,
                aAddr1.getSourcePort()!.source_port_id,
                bAddr1.getSourcePort()!.source_port_id,
              ],
            }
          }
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const customDrcErrors = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "source_component_misconfigured_error")

  expect(customDrcErrors).toHaveLength(1)
  expect(customDrcErrors[0]).toMatchObject({
    error_type: "source_component_misconfigured_error",
    message: "Two TMP117 chips share the same I2C address",
  })
})
