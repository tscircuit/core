import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reference divider reproduces a backtracking schematic wire", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  // Reduced from imrishabh18/rp2040-motor-controller v1.0.52.
  // The generic driver retains only the three reference pins used by this section.
  circuit.add(
    <board schMaxTraceDistance={4}>
      <chip
        name="DRIVER"
        pinLabels={{ pin1: "V3P3OUT", pin2: "AVREF", pin3: "BVREF" }}
      />
      <group name="reference" schAutoLayoutEnabled>
        <schematicsection
          name="driver_reference"
          displayName="1 A Current Reference"
        />
        <capacitor
          name="C_DRV_3V3"
          capacitance="470nF"
          schOrientation="vertical"
          schSectionName="driver_reference"
        />
        <resistor
          name="R_DRV_REF_TOP"
          resistance="2.4k"
          schOrientation="pos_bottom"
          schSectionName="driver_reference"
        />
        <resistor
          name="R_DRV_REF_BOTTOM"
          resistance="2k"
          schOrientation="vertical"
          schSectionName="driver_reference"
        />
        <capacitor
          name="C_DRV_REF"
          capacitance="100nF"
          schOrientation="vertical"
          schSectionName="driver_reference"
        />
      </group>
      <trace
        from=".C_DRV_3V3 > .pin1"
        to=".DRIVER > .V3P3OUT"
        schDisplayLabel="DRV_3V3"
      />
      <trace
        from=".R_DRV_REF_TOP > .pin1"
        to=".DRIVER > .V3P3OUT"
        schDisplayLabel="DRV_3V3"
      />
      <trace from=".C_DRV_3V3 > .pin2" to="net.GND" />
      <trace
        from=".R_DRV_REF_TOP > .pin2"
        to=".R_DRV_REF_BOTTOM > .pin1"
        schDisplayLabel="DRV_VREF"
      />
      <trace
        from=".R_DRV_REF_BOTTOM > .pin1"
        to=".DRIVER > .AVREF"
        schDisplayLabel="DRV_VREF"
      />
      <trace
        from=".DRIVER > .AVREF"
        to=".DRIVER > .BVREF"
        schDisplayLabel="DRV_VREF"
      />
      <trace
        from=".C_DRV_REF > .pin1"
        to=".DRIVER > .AVREF"
        schDisplayLabel="DRV_VREF"
      />
      <trace from=".R_DRV_REF_BOTTOM > .pin2" to="net.GND" />
      <trace from=".C_DRV_REF > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 800,
    height: 1000,
  })
})
