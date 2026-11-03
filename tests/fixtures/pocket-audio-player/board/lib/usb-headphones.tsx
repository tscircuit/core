import { LTST_C190TBKT } from "../imports/LTST_C190TBKT"
import { XFL4020_102MEC } from "../imports/XFL4020_102MEC"
import { TYPE_C_31_M_12 } from "../imports/TYPE_C_31_M_12"
import { TUSB320LAIRWBR } from "../imports/TUSB320LAIRWBR"
import { TPS61023DRLR } from "../imports/TPS61023DRLR"
import { TPS2553DBVR } from "../imports/TPS2553DBVR"
import { USBLC6_2SC6 } from "../imports/USBLC6_2SC6"
import { R, C } from "./passives"

export function UsbHeadphones() {
  return (
    <>
      <schematicsheet
        name="typec"
        displayName={"U6 TUSB320LAI, 3.3 V\nDFP, I2C address 0x47"}
        sheetIndex={7}
      >
        <group
          name="typec_components"
          schGrid
          gridCols={4}
          gridGap={4}
          pcbRelative
        >
          <TYPE_C_31_M_12
            name="J2"
            pcbX={14}
            pcbY={-38}
            pcbRotation={0}
            noConnect={["B8", "A8"]}
            connections={{
              GND1: "net.GND",
              GND2: "net.GND",
              EH1: "net.GND",
              EH2: "net.GND",
              EH3: "net.GND",
              EH4: "net.GND",
              VBUS1: "net.USB_VBUS",
              VBUS2: "net.USB_VBUS",
              CC1: "net.HOST_CC1",
              CC2: "net.HOST_CC2",
              DP1: "net.USB_DP",
              DP2: "net.USB_DP",
              DN1: "net.USB_DM",
              DN2: "net.USB_DM",
            }}
          />
          <TUSB320LAIRWBR
            name="U6"
            pcbX={20}
            pcbY={-26}
            layer="bottom"
            connections={{
              CC1: "net.HOST_CC1",
              CC2: "net.HOST_CC2",
              PORT: "net.V3V3",
              VBUS_DET: "net.VBUS_SENSE",
              ADDR: "net.GND",
              pin6: "net.USB_CC_INT_N",
              pin7: "net.I2C_SDA",
              pin8: "net.I2C_SCL",
              ID: "net.USB_ATTACHED_N",
              GND: "net.GND",
              EN_N: "net.GND",
              VDD: "net.V3V3",
            }}
          />
          <group
            name="U6_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"USB-C DFP controller\n3.3 V"}
            pcbRelative
          />
          <C
            name="C50"
            capacitance="100nF"
            from="V3V3"
            pcbX={23}
            pcbY={-23}
            layer="bottom"
          />
          <R
            name="R50"
            resistance="900k"
            from="USB_VBUS"
            to="VBUS_SENSE"
            pcbX={23}
            pcbY={-29}
            layer="bottom"
          />
          <R
            name="R51"
            resistance="10k"
            from="V3V3"
            to="USB_ATTACHED_N"
            pcbX={23}
            pcbY={-19}
            layer="bottom"
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="boost"
        displayName={"U7 TPS61023\n5 V USB boost"}
        sheetIndex={8}
      >
        <group
          name="boost_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <C
            name="C52"
            capacitance="22uF"
            from="BOOST_5V"
            pcbX={16}
            pcbY={-19}
            layer="bottom"
          />
          <C
            name="C53"
            capacitance="22uF"
            from="BOOST_5V"
            pcbX={16}
            pcbY={-16}
            layer="bottom"
          />
          <TPS61023DRLR
            name="U7"
            pcbX={12}
            pcbY={-18}
            layer="bottom"
            connections={{
              VIN: "net.VSYS",
              GND: "net.GND",
              EN: "net.USB_ENABLE",
              SW: "net.BOOST_SW",
              VOUT: "net.BOOST_5V",
              FB: "net.BOOST_FB",
            }}
          />
          <group
            name="U7_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"USB VBUS boost\n5 V"}
            pcbRelative
          />
          <XFL4020_102MEC
            name="L2"
            pcbX={12}
            pcbY={-23}
            layer="bottom"
            connections={{ pin1: "net.VSYS", pin2: "net.BOOST_SW" }}
          />
          <C
            name="C51"
            capacitance="10uF"
            from="VSYS"
            pcbX={8}
            pcbY={-19}
            layer="bottom"
          />

          <R
            name="R52"
            resistance="73.2k"
            from="BOOST_5V"
            to="BOOST_FB"
            pcbX={9}
            pcbY={-14}
            layer="bottom"
          />
          <R
            name="R53"
            pcbRotation={180}
            resistance="10k"
            from="BOOST_FB"
            to="GND"
            pcbX={12}
            pcbY={-14}
            layer="bottom"
          />
          <R
            name="R54"
            resistance="100k"
            from="USB_ENABLE"
            to="GND"
            pcbX={9}
            pcbY={-11}
            layer="bottom"
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="host_power"
        displayName={"U8 TPS2553\n600 mA nominal USB current limit"}
        sheetIndex={9}
      >
        <group
          name="host_power_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <TPS2553DBVR
            name="U8"
            pcbX={12}
            pcbY={-29}
            layer="bottom"
            connections={{
              IN: "net.BOOST_5V",
              GND: "net.GND",
              EN: "net.USB_ENABLE",
              pin4: "net.USB_FAULT_N",
              ILIM: "net.USB_ILIM",
              OUT: "net.USB_VBUS",
            }}
          />
          <group
            name="U8_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"USB protection\n600 mA"}
            pcbRelative
          />
          <R
            name="R55"
            resistance="43.2k"
            from="USB_ILIM"
            to="GND"
            pcbX={5}
            pcbY={-25}
            layer="bottom"
          />
          <C
            name="C54"
            capacitance="1uF"
            from="USB_VBUS"
            pcbX={17}
            pcbY={-30}
            layer="bottom"
          />
          <R
            name="R56"
            resistance="10k"
            from="V3V3"
            to="USB_FAULT_N"
            pcbX={4}
            pcbY={-29}
            layer="bottom"
          />
          <R
            name="R57"
            resistance="10k"
            from="USB_VBUS"
            to="GND"
            pcbX={17}
            pcbY={-33}
            layer="bottom"
          />
          <R
            name="R60"
            resistance="4.7k"
            from="USB_VBUS"
            to="USB_LED_A"
            pcbX={23}
            pcbY={-31}
          />
          <LTST_C190TBKT
            name="LED4"
            schRotation={-90}
            color="blue"
            pcbX={23}
            pcbY={-34}
            connections={{ anode: "net.USB_LED_A", cathode: "net.GND" }}
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="usb_phy"
        displayName={"U9 USBLC6-2SC6\nUSB full-speed ESD protection"}
        sheetIndex={10}
      >
        <group
          name="usb_phy_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <USBLC6_2SC6
            name="U9"
            pcbX={17}
            pcbY={-28}
            internallyConnectedPins={[
              ["pin1", "pin6"],
              ["pin3", "pin4"],
            ]}
            datasheetUrl="https://www.st.com/resource/en/datasheet/usblc6-2.pdf"
            connections={{
              pin1: "net.USB_DP",
              pin6: "net.USB_DP",
              pin3: "net.USB_DM",
              pin4: "net.USB_DM",
              pin2: "net.GND",
              pin5: "net.USB_VBUS",
            }}
          />
          <group
            name="U9_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"USB ESD protection\nFull-speed"}
            pcbRelative
          />
          <R
            name="R58"
            pcbRotation={180}
            resistance="22"
            from="USB_DP_MCU"
            to="USB_DP"
            pcbX={12}
            pcbY={19.4349527}
            layer="bottom"
          />
          <R
            name="R59"
            pcbRotation={180}
            resistance="22"
            from="USB_DM_MCU"
            to="USB_DM"
            pcbX={12}
            pcbY={20.9049527}
            layer="bottom"
          />
        </group>
      </schematicsheet>
    </>
  )
}
