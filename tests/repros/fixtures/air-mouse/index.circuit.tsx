import { ESP32_WROOM_32E_N4 } from "./imports/ESP32_WROOM_32E_N4"
import { ICM_20948 } from "./imports/ICM_20948"
import { KT_0603R } from "./imports/KT_0603R"
import { MCP73831T_2ACI_OT } from "./imports/MCP73831T_2ACI_OT"
import { AP2112K_3_3TRG1 } from "./imports/AP2112K_3_3TRG1"
import { TYPE_C_16PIN_2MD_073_ } from "./imports/TYPE_C_16PIN_2MD_073_"
import { HX_3x4x2_2P_1_6N_TACTILE_SWITCH as Button } from "./imports/HX_3x4x2_2P_1_6N_TACTILE_SWITCH"
import { MINI_MSK12CO2 } from "./imports/MINI_MSK12CO2"
import { B3B_PH_K_S_LF__SN_ } from "./imports/B3B_PH_K_S_LF__SN_"
import { S2B_PH_K_S_LF__SN_ } from "./imports/S2B_PH_K_S_LF__SN_"

const R = (p: any) => <resistor footprint="0603" {...p} />
const C = (p: any) => (
  <capacitor footprint="0603" schOrientation="vertical" {...p} />
)

const tscircuitLogoSvg = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 101">
    <path d="M71 26.852L73.349 27.006L75.659 27.465L77.888 28.222L80 29.264L81.958 30.572L83.728 32.124L85.28 33.894L86.588 35.852L87.63 37.964L88.387 40.193L88.846 42.503L89 44.852V82.852L88.846 85.201L88.387 87.511L87.63 89.74L86.588 91.852L85.28 93.81L83.728 95.58L81.958 97.132L80 98.44L77.888 99.482L75.659 100.239L73.349 100.698L71 100.852H29L26.651 100.698L24.341 100.239L22.112 99.482L20 98.44L18.042 97.132L16.272 95.58L14.72 93.81L13.412 91.852L12.37 89.74L11.613 87.511L11.154 85.201L11 82.852V44.852L11.154 42.503L11.613 40.193L12.37 37.964L13.412 35.852L14.72 33.894L16.272 32.124L18.042 30.572L20 29.264L22.112 28.222L24.341 27.465L26.651 27.006L29 26.852Z" fill="#000"/>
    <path d="M78.5 37.852C75.806 37.852 74.122 40.769 75.469 43.102C76.094 44.185 77.25 44.852 78.5 44.852C81.194 44.852 82.878 41.935 81.531 39.602C80.906 38.519 79.75 37.852 78.5 37.852Z" fill="white"/>
    <path d="M61.575 59.975V71.499C61.575 72.302 61.389 72.89 61.016 73.262C60.615 73.606 59.956 73.778 59.038 73.778H56.243V78.852H60.027C65.101 78.852 67.638 76.387 67.638 71.456V59.975H70.476V55.03H67.638V49.139H61.575V55.03H56.243V59.975H61.575ZM42.797 79.239C44.747 79.239 46.495 78.895 48.043 78.207C49.591 77.49 50.824 76.53 51.741 75.326C52.63 74.122 53.117 72.789 53.203 71.327H47.14C47.026 72.244 46.581 73.004 45.807 73.606C45.005 74.208 44.016 74.509 42.84 74.509C41.694 74.509 40.805 74.28 40.174 73.821C39.515 73.362 39.185 72.775 39.185 72.058C39.185 71.284 39.587 70.711 40.389 70.338C41.163 69.937 42.411 69.507 44.13 69.048C45.908 68.618 47.37 68.174 48.516 67.715C49.634 67.256 50.609 66.554 51.44 65.608C52.243 64.662 52.644 63.386 52.644 61.781C52.644 60.462 52.272 59.258 51.526 58.169C50.752 57.08 49.663 56.22 48.258 55.589C46.825 54.958 45.148 54.643 43.227 54.643C40.389 54.643 38.125 55.36 36.433 56.793C34.742 58.198 33.81 60.104 33.638 62.512H39.4C39.486 61.566 39.888 60.821 40.604 60.276C41.292 59.703 42.224 59.416 43.399 59.416C44.489 59.416 45.334 59.617 45.936 60.018C46.51 60.419 46.796 60.978 46.796 61.695C46.796 62.498 46.395 63.114 45.592 63.544C44.79 63.945 43.543 64.361 41.851 64.791C40.131 65.221 38.712 65.665 37.594 66.124C36.476 66.583 35.516 67.299 34.713 68.274C33.882 69.22 33.452 70.481 33.423 72.058C33.423 73.434 33.81 74.667 34.584 75.756C35.33 76.845 36.419 77.705 37.852 78.336C39.257 78.938 40.905 79.239 42.797 79.239Z" fill="white"/>
  </svg>
`)}`

export default function AirMouse() {
  return (
    <board
      width="44mm"
      height="68mm"
      solderMaskColor="blue"
      silkscreenColor="white"
      schSheetName="Main"
      schTraceAutoLabelEnabled={false}
    >
      <schematicsheet name="Main" displayName="Air Mouse" sheetIndex={1} />
      <schematicsection name="USB" displayName="USB-C charging input" />
      <schematicsection
        name="Charger"
        displayName="Li-ion charger and battery"
      />
      <schematicsection name="Regulator" displayName="Switched 3.3 V supply" />
      <schematicsection name="Controller" displayName="ESP32, reset and boot" />
      <schematicsection
        name="Motion"
        displayName="Motion sensor and I2C pull-ups"
      />
      <schematicsection
        name="Interface"
        displayName="Programming and external buttons"
      />

      <TYPE_C_16PIN_2MD_073_
        name="J1"
        pcbX={0}
        pcbY={-30.1}
        pcbRotation={0}
        schX={-12.8}
        schY={4.95}
        schSectionName="USB"
      />
      <R
        name="R1"
        resistance="5.1k"
        pcbX={-8}
        pcbY={-27}
        schX={-14.4}
        schY={2.75}
        schSectionName="USB"
        supplierPartNumbers={{ jlcpcb: ["C23186"] }}
      />
      <R
        name="R2"
        resistance="5.1k"
        pcbX={-8}
        pcbY={-24.5}
        schX={-11.2}
        schY={2.75}
        schSectionName="USB"
        supplierPartNumbers={{ jlcpcb: ["C23186"] }}
      />
      <MCP73831T_2ACI_OT
        name="U2"
        schHeight={0.6}
        pcbX={0}
        pcbY={-23.5}
        schX={-5.66}
        schY={2.72}
        schSectionName="Charger"
      />
      <R
        name="R3"
        resistance="2k"
        pcbX={4}
        pcbY={-26}
        schX={-1.08}
        schY={2.72}
        schSectionName="Charger"
        supplierPartNumbers={{ jlcpcb: ["C22975"] }}
      />
      <C
        name="C1"
        capacitance="10uF"
        pcbX={-5}
        pcbY={-23.5}
        schX={-8}
        schY={3.3}
        schSectionName="Charger"
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
      />
      <C
        name="C2"
        capacitance="10uF"
        pcbX={7}
        pcbY={-26}
        schX={0.35}
        schY={3.3}
        schSectionName="Charger"
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
      />
      <KT_0603R
        name="LED1"
        pcbX={-4}
        pcbY={-21.5}
        schX={-2.4}
        schY={6.6}
        schRotation={0}
        schSectionName="Charger"
      />
      <R
        name="R4"
        resistance="1k"
        pcbX={4.5}
        pcbY={-21.5}
        schX={-4.8}
        schY={6.6}
        schSectionName="Charger"
        supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      />
      <S2B_PH_K_S_LF__SN_
        name="J2"
        pcbX={16}
        pcbY={-26}
        pcbRotation={270}
        schX={0}
        schY={4.95}
        schSectionName="Charger"
      />
      <MINI_MSK12CO2
        name="SW1"
        pcbX={16}
        pcbY={-17}
        pcbRotation={90}
        schX={5.6}
        schY={4.95}
        schSectionName="Regulator"
      />
      <AP2112K_3_3TRG1
        name="U3"
        schHeight={0.6}
        pcbX={11}
        pcbY={-14}
        schX={9.6}
        schY={4.95}
        schSectionName="Regulator"
      />
      <C
        name="C3"
        capacitance="10uF"
        pcbX={6}
        pcbY={-14}
        schX={7.2}
        schY={3.3}
        schSectionName="Regulator"
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
      />
      <C
        name="C4"
        capacitance="10uF"
        pcbX={16}
        pcbY={-11}
        schX={12}
        schY={3.3}
        schSectionName="Regulator"
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
      />

      <ESP32_WROOM_32E_N4
        name="U1"
        schHeight={4}
        pcbX={3.5}
        pcbY={23.5}
        pcbRotation={270}
        allowOffBoard
        schX={0}
        schY={-2.2}
        schSectionName="Controller"
      />
      <R
        name="R5"
        resistance="10k"
        pcbX={-10}
        pcbY={13}
        schX={-5.6}
        schY={-1.1}
        schSectionName="Controller"
        supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      />
      <C
        name="C5"
        capacitance="1uF"
        pcbX={-13}
        pcbY={13}
        schX={-8}
        schY={-4.95}
        schSectionName="Controller"
        supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      />
      <R
        name="R6"
        resistance="10k"
        pcbX={-10}
        pcbY={18}
        schX={-5.6}
        schY={-4.02}
        schSectionName="Controller"
        supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      />
      <C
        name="C6"
        capacitance="100nF"
        pcbX={-10}
        pcbY={8}
        schX={1.6}
        schY={-4.95}
        schSectionName="Controller"
        supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      />
      <C
        name="C7"
        capacitance="10uF"
        pcbX={-10}
        pcbY={10.5}
        schX={4}
        schY={-4.95}
        schSectionName="Controller"
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
      />
      <Button
        name="SW2"
        pcbX={-17}
        pcbY={8}
        schX={-8}
        schY={-1.1}
        schSectionName="Controller"
      />
      <Button
        name="SW3"
        pcbX={-17}
        pcbY={3}
        schX={-8}
        schY={-3.3}
        schSectionName="Controller"
      />
      <connector
        name="J3"
        footprint="pinrow6_p2.54mm"
        doNotPlace
        pcbX={-16}
        pcbY={-24}
        pcbRotation={270}
        schX={9.6}
        schY={-1.65}
        schSectionName="Interface"
        pinLabels={{
          pin1: "3V3",
          pin2: "GND",
          pin3: "TX",
          pin4: "RX",
          pin5: "EN",
          pin6: "IO0",
        }}
      />

      <ICM_20948
        name="U4"
        schHeight={2.6}
        pcbX={0}
        pcbY={-5}
        pcbRotation={0}
        schX={-2.4}
        schY={-7.4}
        schSectionName="Motion"
      />
      <C
        name="C8"
        capacitance="100nF"
        pcbX={4}
        pcbY={-8}
        schX={-6.4}
        schY={-9.6}
        schSectionName="Motion"
        supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      />
      <C
        name="C9"
        maxDecouplingTraceLength="10mm"
        capacitance="10nF"
        pcbX={4}
        pcbY={-5}
        schX={0}
        schY={-9.6}
        schSectionName="Motion"
        supplierPartNumbers={{ jlcpcb: ["C57112"] }}
      />
      <C
        name="C10"
        maxDecouplingTraceLength="10mm"
        capacitance="100nF"
        pcbX={4}
        pcbY={-2}
        schX={2.4}
        schY={-9.6}
        schSectionName="Motion"
        supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      />
      <R
        name="R7"
        resistance="4.7k"
        pcbX={-6.5}
        pcbY={-8}
        schX={-8.8}
        schY={-6.3}
        schSectionName="Motion"
        supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      />
      <R
        name="R8"
        resistance="4.7k"
        pcbX={-6.5}
        pcbY={-11}
        schX={-8.8}
        schY={-7.95}
        schSectionName="Motion"
        supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      />
      <B3B_PH_K_S_LF__SN_
        name="J4"
        schHeight={0.4}
        pcbX={-18.5}
        pcbY={24}
        pcbRotation={90}
        schX={9.6}
        schY={-4.4}
        schSectionName="Interface"
      />

      <trace name="J1_A4B9_to_net_VBUS" from="J1.A4B9" to="net.VBUS" />
      <trace name="J1_B4A9_to_net_VBUS" from="J1.B4A9" to="net.VBUS" />
      <trace name="J1_A1B12_to_net_GND" from="J1.A1B12" to="net.GND" />
      <trace name="J1_B1A12_to_net_GND" from="J1.B1A12" to="net.GND" />
      <trace name="J1_EH1_to_net_GND" from="J1.EH1" to="net.GND" />
      <trace name="J1_EH2_to_net_GND" from="J1.EH2" to="net.GND" />
      <trace name="J1_A5_to_R1_pin1" from="J1.A5" to="R1.pin1" />
      <trace name="R1_pin2_to_net_GND" from="R1.pin2" to="net.GND" />
      <trace name="J1_A8_to_R2_pin1" from="J1.A8" to="R2.pin1" />
      <trace name="R2_pin2_to_net_GND" from="R2.pin2" to="net.GND" />
      <trace name="U2_VDD_to_net_VBUS" from="U2.VDD" to="net.VBUS" />
      <trace name="U2_VSS_to_net_GND" from="U2.VSS" to="net.GND" />
      <trace name="U2_PROG_to_R3_pin1" from="U2.PROG" to="R3.pin1" />
      <trace name="R3_pin2_to_net_GND" from="R3.pin2" to="net.GND" />
      <trace name="C1_pin1_to_net_VBUS" from="C1.pin1" to="net.VBUS" />
      <trace name="C1_pin2_to_net_GND" from="C1.pin2" to="net.GND" />
      <trace name="U2_VBAT_to_net_BAT_P" from="U2.VBAT" to="net.BAT_P" />
      <trace name="C2_pin1_to_net_BAT_P" from="C2.pin1" to="net.BAT_P" />
      <trace name="C2_pin2_to_net_GND" from="C2.pin2" to="net.GND" />
      <trace name="net_VBUS_to_R4_pin1" from="net.VBUS" to="R4.pin1" />
      <trace name="CHARGE_LED" from="R4.pin2" to="LED1.anode" />
      <trace name="LED1_cathode_to_U2_STAT" from="LED1.cathode" to="U2.STAT" />
      <trace name="J2_pin1_to_net_BAT_P" from="J2.pin1" to="net.BAT_P" />
      <trace name="J2_pin2_to_net_GND" from="J2.pin2" to="net.GND" />
      <trace name="net_BAT_P_to_SW1_pin2" from="net.BAT_P" to="SW1.pin2" />
      <trace name="SW1_pin1_to_net_VBAT_SW" from="SW1.pin1" to="net.VBAT_SW" />
      <trace name="U3_VIN_to_net_VBAT_SW" from="U3.VIN" to="net.VBAT_SW" />
      <trace name="U3_EN_to_net_VBAT_SW" from="U3.EN" to="net.VBAT_SW" />
      <trace name="U3_GND_to_net_GND" from="U3.GND" to="net.GND" />
      <trace name="C3_pin1_to_net_VBAT_SW" from="C3.pin1" to="net.VBAT_SW" />
      <trace name="C3_pin2_to_net_GND" from="C3.pin2" to="net.GND" />
      <trace name="U3_VOUT_to_net_V3V3" from="U3.VOUT" to="net.V3V3" />
      <trace name="C4_pin1_to_net_V3V3" from="C4.pin1" to="net.V3V3" />
      <trace name="C4_pin2_to_net_GND" from="C4.pin2" to="net.GND" />

      <trace name="U1_3V3_to_net_V3V3" from="U1.3V3" to="net.V3V3" />
      <trace name="U1_GND1_to_net_GND" from="U1.GND1" to="net.GND" />
      <trace name="U1_GND2_to_net_GND" from="U1.GND2" to="net.GND" />
      <trace name="U1_GND3_to_net_GND" from="U1.GND3" to="net.GND" />
      <trace name="U1_GND4_to_net_GND" from="U1.GND4" to="net.GND" />
      <trace name="U1_EN_to_R5_pin1" from="U1.EN" to="R5.pin1" />
      <trace name="R5_pin2_to_net_V3V3" from="R5.pin2" to="net.V3V3" />
      <trace name="U1_EN_to_C5_pin1" from="U1.EN" to="C5.pin1" />
      <trace name="C5_pin2_to_net_GND" from="C5.pin2" to="net.GND" />
      <trace name="BOOT" from="U1.IO0" to="R6.pin1" />
      <trace name="R6_pin2_to_net_V3V3" from="R6.pin2" to="net.V3V3" />
      <trace name="C6_pin1_to_net_V3V3" from="C6.pin1" to="net.V3V3" />
      <trace name="C6_pin2_to_net_GND" from="C6.pin2" to="net.GND" />
      <trace name="C7_pin1_to_net_V3V3" from="C7.pin1" to="net.V3V3" />
      <trace name="C7_pin2_to_net_GND" from="C7.pin2" to="net.GND" />
      <trace name="SW2_pin1_to_U1_EN" from="SW2.pin1" to="U1.EN" />
      <trace name="SW2_pin2_to_net_GND" from="SW2.pin2" to="net.GND" />
      <trace name="SW3_pin1_to_U1_IO0" from="SW3.pin1" to="U1.IO0" />
      <trace name="SW3_pin2_to_net_GND" from="SW3.pin2" to="net.GND" />
      <trace name="J3_3V3_to_net_V3V3" from="J3.3V3" to="net.V3V3" />
      <trace name="J3_GND_to_net_GND" from="J3.GND" to="net.GND" />
      <trace name="J3_TX_to_U1_TXD0" from="J3.TX" to="U1.TXD0" />
      <trace name="J3_RX_to_U1_RXD0" from="J3.RX" to="U1.RXD0" />
      <trace name="J3_EN_to_U1_EN" from="J3.EN" to="U1.EN" />
      <trace name="J3_IO0_to_U1_IO0" from="J3.IO0" to="U1.IO0" />
      <trace name="J4_pin1_to_U1_IO19" from="J4.pin1" to="U1.IO19" />
      <trace name="J4_pin2_to_net_GND" from="J4.pin2" to="net.GND" />
      <trace name="J4_pin3_to_U1_IO5" from="J4.pin3" to="U1.IO5" />

      <trace
        name="U4_VDD_to_net_V3V3"
        from="U4.VDD"
        to="net.V3V3"
        thickness="0.1mm"
      />
      <trace
        name="U4_VDDIO_to_net_V3V3"
        from="U4.VDDIO"
        to="net.V3V3"
        thickness="0.1mm"
      />
      <trace
        name="U4_NCS_to_net_V3V3"
        from="U4.NCS"
        to="net.V3V3"
        thickness="0.1mm"
      />
      <trace
        name="U4_GND_to_net_GND"
        from="U4.GND"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="U4_EP_to_net_GND"
        from="U4.EP"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="U4_FSYNC_to_net_GND"
        from="U4.FSYNC"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="U4_AD0_to_net_GND"
        from="U4.AD0"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="U4_INT1_to_U1_IO23"
        from="U4.INT1"
        to="U1.IO23"
        thickness="0.1mm"
      />
      <trace
        name="U4_REGOUT_to_C8_pin1"
        from="U4.REGOUT"
        to="C8.pin1"
        thickness="0.1mm"
      />
      <trace name="C8_pin2_to_net_GND" from="C8.pin2" to="net.GND" />
      <trace
        name="U4_VDDIO_to_C9_pin1"
        from="U4.VDDIO"
        to="C9.pin1"
        thickness="0.1mm"
      />
      <trace name="C9_pin2_to_net_GND" from="C9.pin2" to="net.GND" />
      <trace
        name="U4_VDD_to_C10_pin1"
        from="U4.VDD"
        to="C10.pin1"
        thickness="0.1mm"
      />
      <trace name="C10_pin2_to_net_GND" from="C10.pin2" to="net.GND" />
      <trace
        name="U4_SDA_to_U1_IO21"
        from="U4.SDA"
        to="U1.IO21"
        thickness="0.1mm"
      />
      <trace
        name="U4_SCL_to_U1_IO22"
        from="U4.SCL"
        to="U1.IO22"
        thickness="0.1mm"
      />
      <trace
        name="U4_SDA_to_R7_pin1"
        from="U4.SDA"
        to="R7.pin1"
        thickness="0.1mm"
      />
      <trace name="R7_pin2_to_net_V3V3" from="R7.pin2" to="net.V3V3" />
      <trace
        name="U4_SCL_to_R8_pin1"
        from="U4.SCL"
        to="R8.pin1"
        thickness="0.1mm"
      />
      <trace name="R8_pin2_to_net_V3V3" from="R8.pin2" to="net.V3V3" />

      <silkscreentext text="AIR MOUSE" pcbX={0} pcbY={1} fontSize={1.4} />
      <silkscreentext
        text="L G R"
        pcbX={-18.5}
        pcbY={27}
        pcbRotation={90}
        fontSize={0.8}
      />
      <silkscreentext text="BOOT" pcbX={-21} pcbY={3} fontSize={0.8} />
      <silkscreentext text="RST" pcbX={-21} pcbY={8} fontSize={0.8} />
      <copperpour
        name="GND_PLANE_BOTTOM"
        connectsTo="net.GND"
        layer="bottom"
        clearance="0.2mm"
        boardEdgeMargin="0.3mm"
      />
      <silkscreengraphic
        imageUrl={tscircuitLogoSvg}
        pcbX={3.5}
        pcbY={23}
        width="10mm"
        height="11mm"
        layer="bottom"
      />
      <silkscreentext
        text="tscircuit.com"
        pcbX={3.5}
        pcbY={15.5}
        fontSize="1.4mm"
        layer="bottom"
      />
    </board>
  )
}
