import { ESP32_S3_WROOM_1_N8R8 } from "../imports/ESP32_S3_WROOM_1_N8R8"
import { R, C } from "./passives"

export function Processor() {
  return (
    <>
      <schematicsheet
        name="processor"
        displayName={"U1 ESP32-S3, 3.3 V\n8 MB flash + 8 MB PSRAM"}
        sheetIndex={0}
      >
        <group
          name="processor_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <C
            name="C2"
            capacitance="10uF"
            from="V3V3"
            pcbX={12}
            pcbY={33}
            layer="bottom"
          />
          <C
            name="C3"
            capacitance="100nF"
            from="V3V3"
            pcbX={12}
            pcbY={31}
            layer="bottom"
          />
          <ESP32_S3_WROOM_1_N8R8
            name="U1"
            pcbX={0}
            pcbY={27}
            layer="bottom"
            datasheetUrl="https://documentation.espressif.com/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf"
            connections={{
              GND1: "net.GND",
              GND2: "net.GND",
              "3V3": "net.V3V3",
              EN: "net.MCU_EN",
              IO0: "net.BOOT",
              IO1: "net.BAT_ADC",
              IO2: "net.BTN_POWER",
              IO4: "net.BTN_PREV",
              IO5: "net.BTN_PLAY",
              IO6: "net.BTN_NEXT",
              IO7: "net.BTN_VOL_DOWN",
              IO8: "net.BTN_VOL_UP",
              IO9: "net.SD_CS",
              IO10: "net.SD_CLK",
              IO11: "net.SD_MOSI",
              IO12: "net.SD_MISO",
              IO13: "net.LCD_CLK",
              IO14: "net.LCD_MOSI",
              IO15: "net.LCD_CS",
              IO16: "net.LCD_DC",
              IO17: "net.LCD_RST",
              IO18: "net.LCD_BL",
              IO19: "net.USB_DM_MCU",
              IO20: "net.USB_DP_MCU",
              IO21: "net.I2S_BCLK",
              IO47: "net.I2S_LRCLK",
              IO48: "net.I2S_DOUT",
              IO38: "net.I2C_SDA",
              IO39: "net.I2C_SCL",
              IO40: "net.AUDIO_ENABLE",
              IO41: "net.USB_ENABLE",
              IO42: "net.USB_FAULT_N",
              IO3: "net.SD_DETECT",
              RXD0: "net.UART_RX",
              TXD0: "net.UART_TX",
            }}
          />
          <group
            name="U1_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"ESP32-S3 processor\n3.3 V"}
            pcbRelative
          />
          <R
            name="R1"
            pcbRotation={180}
            resistance="10k"
            from="V3V3"
            to="MCU_EN"
            pcbX={15}
            pcbY={33}
            layer="bottom"
          />
          <C
            name="C1"
            capacitance="1uF"
            from="MCU_EN"
            pcbX={15}
            pcbY={31}
            layer="bottom"
          />

          <R
            name="R2"
            resistance="10k"
            from="V3V3"
            to="BOOT"
            pcbX={-12}
            pcbY={29}
            layer="bottom"
          />
          <connector
            name="J7"
            footprint="pinrow6_p1.27mm_id0.6mm_od0.95mm"
            pcbX={16}
            pcbY={26}
            layer="bottom"
            manufacturerPartNumber="M50-3530642"
            pinLabels={{
              pin1: "V3V3",
              pin2: "GND",
              pin3: "TX",
              pin4: "RX",
              pin5: "EN",
              pin6: "BOOT",
            }}
            connections={{
              pin1: "net.V3V3",
              pin2: "net.GND",
              pin3: "net.UART_TX",
              pin4: "net.UART_RX",
              pin5: "net.MCU_EN",
              pin6: "net.BOOT",
            }}
          />
          <R
            name="R3"
            pcbRotation={180}
            resistance="470k"
            from="VBAT"
            to="BAT_ADC"
            pcbX={13}
            pcbY={24}
            layer="bottom"
          />
          <R
            name="R4"
            resistance="100k"
            from="BAT_ADC"
            to="GND"
            pcbX={16}
            pcbY={24}
            layer="bottom"
          />
          <C
            name="C4"
            capacitance="100nF"
            from="BAT_ADC"
            pcbX={19}
            pcbY={24}
            layer="bottom"
          />
        </group>
      </schematicsheet>
      {/* All nine manufacturer pin-41 pads share this local ground stitch. */}
      <trace
        name="module_thermal_stitch"
        from=".U1 > .GND3"
        to="net.GND"
        thickness="0.3mm"
        pcbPath={[
          ".U1 > .GND3",
          { x: 2.900172, y: -0.0751713 },
          { x: 2.900172, y: 1.3248767 },
          { x: 0.100076, y: 1.3248767 },
          { x: 0.100076, y: 2.7249247 },
          { x: 2.900172, y: 2.7249247 },
          { x: -0.95, y: 2.7249247 },
          {
            x: -0.95,
            y: 2.7249247,
            via: true,
            fromLayer: "bottom",
            toLayer: "top",
          },
          { x: -0.95, y: 2.7249247 },
        ]}
      />
      <schematicsheet
        name="control_bus"
        displayName={"3.3 V I2C and CC interrupt"}
        sheetIndex={1}
      >
        <group
          name="control_bus_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <R
            name="R5"
            resistance="10k"
            from="V3V3"
            to="I2C_SDA"
            pcbX={13}
            pcbY={17.5}
            layer="bottom"
          />
          <R
            name="R6"
            resistance="10k"
            from="V3V3"
            to="I2C_SCL"
            pcbX={16}
            pcbY={17.5}
            layer="bottom"
          />
          <R
            name="R7"
            pcbRotation={180}
            resistance="10k"
            from="V3V3"
            to="USB_CC_INT_N"
            pcbX={19}
            pcbY={17.5}
            layer="bottom"
          />
        </group>
      </schematicsheet>
    </>
  )
}
