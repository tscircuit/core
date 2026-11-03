import { Fragment } from "react"
import { TF_01A } from "../imports/TF_01A"
import { TS_1187A_B_A_B } from "../imports/TS_1187A_B_A_B"
import { R, C } from "./passives"

export function DisplayStorageControls() {
  return (
    <>
      <schematicsheet
        name="Display"
        displayName="1.3 inch SPI color display"
        sheetIndex={11}
      >
        <group
          name="Display_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <connector
            name="J5"
            footprint="pinrow8_p2.54mm"
            pcbX={3}
            pcbY={15}
            manufacturerPartNumber="61300811821"
            pinLabels={{
              pin1: "VCC",
              pin2: "GND",
              pin3: "DIN",
              pin4: "CLK",
              pin5: "CS",
              pin6: "DC",
              pin7: "RST",
              pin8: "BL",
            }}
            connections={{
              pin1: "net.V3V3",
              pin2: "net.GND",
              pin3: "net.LCD_MOSI",
              pin4: "net.LCD_CLK",
              pin5: "net.LCD_CS",
              pin6: "net.LCD_DC",
              pin7: "net.LCD_RST",
              pin8: "net.LCD_BL",
            }}
          />
          <group
            name="J5_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"ST7789 display\n3.3 V"}
            pcbRelative
          />
          <C name="C60" capacitance="10uF" from="V3V3" pcbX={-15} pcbY={17} />
          <R
            name="R70"
            pcbRotation={180}
            resistance="10k"
            from="V3V3"
            to="LCD_CS"
            pcbX={17}
            pcbY={12}
          />
          <R
            name="R71"
            resistance="10k"
            from="V3V3"
            to="LCD_RST"
            pcbX={20}
            pcbY={12}
          />
          <R
            name="R72"
            resistance="100k"
            from="LCD_BL"
            to="GND"
            pcbX={23}
            pcbY={15}
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="Storage"
        displayName="Removable microSD storage"
        sheetIndex={12}
      >
        <group
          name="Storage_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <TF_01A
            name="J6"
            pcbX={-18}
            pcbY={4}
            pcbRotation={-90}
            connections={{
              pin1: "net.SD_DAT2",
              pin2: "net.SD_CS",
              pin3: "net.SD_MOSI",
              VDD: "net.V3V3",
              pin5: "net.SD_CLK",
              VSS: "net.GND",
              pin7: "net.SD_MISO",
              pin8: "net.SD_DAT1",
              CD: "net.SD_DETECT",
              GND1: "net.GND",
              GND2: "net.GND",
              GND3: "net.GND",
              GND4: "net.GND",
            }}
          />
          <group
            name="J6_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"microSD SPI storage\n3.3 V"}
            pcbRelative
          />
          <C name="C61" capacitance="10uF" from="V3V3" pcbX={-8} pcbY={-1} />
          <C name="C62" capacitance="100nF" from="V3V3" pcbX={-8} pcbY={2} />
          <R
            name="R73"
            resistance="47k"
            from="V3V3"
            to="SD_CS"
            pcbX={-24}
            pcbY={-8}
          />
          <R
            name="R74"
            resistance="47k"
            from="V3V3"
            to="SD_MOSI"
            pcbX={-21}
            pcbY={-8}
          />
          <R
            name="R75"
            resistance="47k"
            from="V3V3"
            to="SD_MISO"
            pcbX={-18}
            pcbY={-8}
          />
          <R
            name="R76"
            resistance="47k"
            from="V3V3"
            to="SD_DAT1"
            pcbX={-15}
            pcbY={-8}
          />
          <R
            name="R77"
            pcbRotation={180}
            resistance="47k"
            from="V3V3"
            to="SD_DAT2"
            pcbX={-12}
            pcbY={-8}
          />
          <R
            name="R78"
            resistance="10k"
            from="V3V3"
            to="SD_DETECT"
            pcbX={-9}
            pcbY={-8}
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="Controls"
        displayName="Playback buttons and service controls"
        sheetIndex={13}
        sheetWidth={420}
        sheetHeight={360}
      >
        <group
          name="controls_layout"
          schGrid
          gridCols={3}
          gridGap={2.5}
          pcbRelative
        >
          {[
            { name: "SW1", net: "BTN_PREV", x: -14, y: -17, label: "PREV" },
            { name: "SW2", net: "BTN_PLAY", x: 0, y: -17, label: "PLAY/MENU" },
            { name: "SW3", net: "BTN_NEXT", x: 14, y: -17, label: "NEXT" },
            { name: "SW4", net: "BTN_VOL_DOWN", x: -7, y: -27, label: "VOL-" },
            { name: "SW5", net: "BTN_VOL_UP", x: 7, y: -27, label: "VOL+" },
            { name: "SW6", net: "BTN_POWER", x: 0, y: -7, label: "WAKE" },
          ].map((button, i) => (
            <Fragment key={button.name}>
              <TS_1187A_B_A_B
                name={button.name}
                pcbX={button.x}
                pcbY={button.y}
                internallyConnectedPins={[
                  ["pin1", "pin2"],
                  ["pin3", "pin4"],
                ]}
                connections={{
                  pin1: `net.${button.net}`,
                  pin2: `net.${button.net}`,
                  pin3: "net.GND",
                  pin4: "net.GND",
                }}
              />
              <R
                name={`R${80 + i}`}
                pcbRotation={i === 0 ? 180 : 0}
                resistance="10k"
                from="V3V3"
                to={button.net}
                pcbX={button.x - 2}
                pcbY={i === 0 ? -24.2 : button.y - 4}
              />
              <C
                name={`C${70 + i}`}
                pcbRotation={i === 0 ? 180 : 0}
                capacitance="100nF"
                from={button.net}
                pcbX={i === 0 ? -19.5 : button.x + 2}
                pcbY={i === 0 ? -24.2 : button.y - 4}
              />
              <silkscreentext
                text={button.label}
                pcbX={button.x}
                pcbY={button.y + (button.name === "SW2" ? 4.2 : 5.2)}
                fontSize={0.8}
              />
            </Fragment>
          ))}
          <connector
            name="J8"
            schPinArrangement={{ topSide: ["pin1"], bottomSide: ["pin2"] }}
            footprint="pinrow2_p1.27mm_id0.6mm_od0.95mm"
            pcbX={-22}
            pcbY={28}
            layer="bottom"
            manufacturerPartNumber="M50-3530242"
            pinLabels={{ pin1: "BOOT", pin2: "GND" }}
            connections={{ pin1: "net.BOOT", pin2: "net.GND" }}
          />
          <connector
            name="J9"
            schPinArrangement={{ topSide: ["pin1"], bottomSide: ["pin2"] }}
            footprint="pinrow2_p1.27mm_id0.6mm_od0.95mm"
            pcbX={-22}
            pcbY={25}
            layer="bottom"
            manufacturerPartNumber="M50-3530242"
            pinLabels={{ pin1: "RESET", pin2: "GND" }}
            connections={{ pin1: "net.MCU_EN", pin2: "net.GND" }}
          />
          <schematicsection
            name="controls_notes"
            displayName="Buttons active low with external pull-ups + RC debounce. Long PLAY opens menu; WAKE requests sleep/wake. J8/J9 service jumpers."
          />
        </group>
      </schematicsheet>
    </>
  )
}
