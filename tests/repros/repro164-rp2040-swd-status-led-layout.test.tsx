import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const gndLabel = {
  displayName: "GND",
  schDisplayLabel: "GND",
} as const

const v3v3Label = {
  displayName: "V3V3",
  schDisplayLabel: "V3V3",
} as const

export default function StatusAndSwdDebug() {
  const statusSection = "status_swd_debug"

  return (
    <board width="40mm" height="25mm" routingDisabled schAutoLayoutEnabled>
      <pushbutton name="SW_BOOT" doNotPlace pcbX={-15} pcbY={5} />
      <pushbutton name="SW_RUN" doNotPlace pcbX={-10} pcbY={5} />

      <resistor
        name="R_BOOT"
        resistance="10k"
        footprint="0402"
        doNotPlace
        pcbX={-5}
        pcbY={5}
      />
      <resistor
        name="R_RUN"
        resistance="10k"
        footprint="0402"
        doNotPlace
        pcbX={0}
        pcbY={5}
      />

      <resistor
        name="R_LED"
        resistance="330"
        footprint="0402"
        doNotPlace
        pcbX={5}
        pcbY={5}
      />
      <led name="D1" color="green" doNotPlace pcbX={10} pcbY={5} />

      <resistor
        name="R_PWR_LED"
        resistance="330"
        footprint="0402"
        doNotPlace
        pcbX={15}
        pcbY={5}
      />
      <led name="D_PWR" color="green" doNotPlace pcbX={15} pcbY={-2} />

      <testpoint
        name="TP_SWCLK"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        pcbX={-6}
        pcbY={-8}
      />
      <testpoint
        name="TP_GND"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        pcbX={-2}
        pcbY={-8}
      />
      <testpoint
        name="TP_SWDIO"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        pcbX={2}
        pcbY={-8}
      />
      <testpoint
        name="TP_3V3"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        pcbX={6}
        pcbY={-8}
      />

      <trace name="BOOT_SW" from=".SW_BOOT > .pin1" to="net.QSPI_SS" />
      <trace name="BOOT_G" from=".SW_BOOT > .pin2" to="net.GND" {...gndLabel} />
      <trace name="BOOT_R" from=".R_BOOT > .pin1" to="net.QSPI_SS" />
      <trace
        name="BOOT_3V3"
        from=".R_BOOT > .pin2"
        to="net.V3V3"
        {...v3v3Label}
      />

      <trace name="RUN_R" from=".R_RUN > .pin1" to="net.RUN" />
      <trace
        name="RUN_3V3"
        from=".R_RUN > .pin2"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace name="RUN_SW" from=".SW_RUN > .pin1" to="net.RUN" />
      <trace name="RUN_G" from=".SW_RUN > .pin2" to="net.GND" {...gndLabel} />

      <trace name="LED_GP25" from="net.LED_GP25" to=".R_LED > .pin1" />
      <trace name="LED_D1" from=".R_LED > .pin2" to=".D1 > .anode" />
      <trace name="LED_G" from=".D1 > .cathode" to="net.GND" {...gndLabel} />

      <trace
        name="PLED_3V3"
        from="net.V3V3"
        to=".R_PWR_LED > .pin1"
        {...v3v3Label}
      />
      <trace name="PLED_D" from=".R_PWR_LED > .pin2" to=".D_PWR > .anode" />
      <trace
        name="PLED_G"
        from=".D_PWR > .cathode"
        to="net.GND"
        {...gndLabel}
      />

      <trace name="SWCLK" from="net.SWCLK" to=".TP_SWCLK > .pin1" />
      <trace name="SWD" from="net.SWD" to=".TP_SWDIO > .pin1" />
      <trace name="TP_G" from=".TP_GND > .pin1" to="net.GND" {...gndLabel} />
      <trace
        name="TP3V3_T"
        from=".TP_3V3 > .pin1"
        to="net.V3V3"
        {...v3v3Label}
      />
    </board>
  )
}

test("repro164: RP2040 SWD and status LED layout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<StatusAndSwdDebug />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
