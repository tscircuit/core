import { PicoSubcircuit } from "./PicoSubcircuit"
import { LCDWiki_2_8_SPI_ILI9341_MSP2807 } from "./imports/LCDWiki_2_8_SPI_ILI9341_MSP2807"
import { KH_6X6X15H_SMT_FS_D } from "./imports/KH_6X6X15H_SMT_FS_D"
import { SK_12E12_G5 } from "./imports/SK_12E12_G5"
import { S2B_PH_K_S_LF__SN_ } from "./imports/S2B_PH_K_S_LF__SN_"
import { SM02B_PASS_TBT_LF__SN_ } from "./imports/SM02B_PASS_TBT_LF__SN_"
import { PAM8403DR_H } from "./imports/PAM8403DR_H"
import { MT3608 } from "./imports/MT3608"
import { SS34 } from "./imports/SS34"
import { SMMS0630_220M } from "./imports/SMMS0630_220M"
import { CL10A106KP8NNNC } from "./imports/CL10A106KP8NNNC"
import { CL10A226MQ8NRNC } from "./imports/CL10A226MQ8NRNC"
import { FRC0603F1302TS } from "./imports/FRC0603F1302TS"
import { A_0603WAF9532T5E } from "./imports/A_0603WAF9532T5E"
import { A_0603WAF1003T5E } from "./imports/A_0603WAF1003T5E"
import { MMBT3904_RANGE_100_300_ } from "./imports/MMBT3904_RANGE_100_300_"
import { AO3401A } from "./imports/AO3401A"
import { BLM18PG121SN1D } from "./imports/BLM18PG121SN1D"
import { RK10J12E002L } from "./imports/RK10J12E002L"

const denseTraceProps = { thickness: "0.08mm" } as const
const batteryTraceProps = { thickness: "0.3mm" } as const
const powerTraceProps = { thickness: "0.4mm" } as const
const speakerTraceProps = { thickness: "0.25mm" } as const
const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3Label = { displayName: "V3V3", schDisplayLabel: "V3V3" } as const
const vsysLabel = { displayName: "VSYS", schDisplayLabel: "VSYS" } as const
const vbusLabel = { displayName: "VBUS", schDisplayLabel: "VBUS" } as const
const speakerY = -14

const schSections = {
  rp2040: "rp2040",
  headers: "headers",
  usb: "usb",
  power: "power",
  flash: "flash",
  clock: "clock",
  controls: "controls",
  display: "display",
  audio: "audio",
  status: "status",
  debug: "debug",
} as const

export default () => (
  <board
    title="Abse GameBoy RP2040 handheld demo board"
    width="106mm"
    height="130mm"
    layers={2}
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.45mm"
    borderRadius="1.5mm"
    autorouter={{ local: true, groupMode: "subcircuit" }}
  >
    <schematicsection name={schSections.rp2040} displayName="RP2040" />
    <schematicsection name={schSections.headers} displayName="Headers" />
    <schematicsection name={schSections.usb} displayName="USB-C" />
    <schematicsection name={schSections.power} displayName="Power" />
    <schematicsection name={schSections.flash} displayName="Flash" />
    <schematicsection name={schSections.clock} displayName="Clock" />
    <schematicsection name={schSections.controls} displayName="Controls" />
    <schematicsection name={schSections.display} displayName="Display" />
    <schematicsection name={schSections.audio} displayName="Audio" />
    <schematicsection name={schSections.status} displayName="Status" />
    <schematicsection name={schSections.debug} displayName="Debug" />

    <net name="GND" isGroundNet />
    <net name="V3V3" isPowerNet />
    <net name="VSYS" isPowerNet />

    <hole name="MH_TOP_LEFT" diameter="3.3mm" pcbX={-48} pcbY={-60} />
    <hole name="MH_TOP_RIGHT" diameter="3.3mm" pcbX={48} pcbY={-60} />
    <hole name="MH_BOTTOM_LEFT" diameter="3.3mm" pcbX={-48} pcbY={60} />
    <hole name="MH_BOTTOM_RIGHT" diameter="3.3mm" pcbX={48} pcbY={60} />

    <PicoSubcircuit pcbRotation="90" pcbX={-18} pcbY={31} />

    <LCDWiki_2_8_SPI_ILI9341_MSP2807
      name="J_LCD"
      schSectionName={schSections.display}
      layer="top"
      pcbX={0}
      pcbY={28}
    />

    <S2B_PH_K_S_LF__SN_
      name="J_BAT"
      schSectionName={schSections.power}
      pcbX={-13}
      pcbY={60}
      pcbRotation={90}
    />
    <cutout
      name="BAT_CABLE_SLOT_STRAIGHT"
      shape="rect"
      width="5mm"
      height="8mm"
      pcbX="-32mm"
      pcbY="61mm"
    />
    <cutout
      name="BAT_CABLE_SLOT_ROUND"
      shape="circle"
      radius="2.5mm"
      pcbX="-32mm"
      pcbY="57mm"
    />
    <SK_12E12_G5
      name="J_PWR_SW"
      schSectionName={schSections.power}
      pcbX={49.7}
      pcbY={8}
      pcbRotation={0}
    />
    <MT3608
      name="U_BAT_BOOST"
      schSectionName={schSections.power}
      pcbX={25}
      pcbY={56}
      pcbRotation={0}
    />
    <SMMS0630_220M
      name="L_BAT_BOOST"
      schSectionName={schSections.power}
      pcbX={16}
      pcbY={56}
      pcbRotation={0}
    />
    <SS34
      name="D_BAT_BOOST"
      schSectionName={schSections.power}
      pcbX={34}
      pcbY={56}
      pcbRotation={0}
    />
    <CL10A106KP8NNNC
      name="C_BAT_IN"
      schSectionName={schSections.power}
      pcbX={22}
      pcbY={61}
      pcbRotation={90}
    />
    <CL10A226MQ8NRNC
      name="C_BAT_OUT"
      schSectionName={schSections.power}
      pcbX={39}
      pcbY={56}
      pcbRotation={90}
    />
    <CL10A106KP8NNNC
      name="C_BAT_IN_BULK"
      schSectionName={schSections.power}
      pcbX={20}
      pcbY={63.5}
      pcbRotation={90}
    />
    <CL10A226MQ8NRNC
      name="C_BAT_OUT_BULK"
      schSectionName={schSections.power}
      pcbX={42}
      pcbY={56}
      pcbRotation={90}
    />
    <A_0603WAF9532T5E
      name="R_BOOST_TOP"
      schSectionName={schSections.power}
      pcbX={30}
      pcbY={61}
      pcbRotation={90}
    />
    <FRC0603F1302TS
      name="R_BOOST_BOT"
      schSectionName={schSections.power}
      pcbX={27}
      pcbY={61}
      pcbRotation={90}
    />
    <A_0603WAF1003T5E
      name="R_BOOST_EN_PULLUP"
      schSectionName={schSections.power}
      pcbX={35}
      pcbY={61}
      pcbRotation={90}
    />
    <A_0603WAF1003T5E
      name="R_USB_BOOST_OFF"
      schSectionName={schSections.power}
      pcbX={43}
      pcbY={61}
      pcbRotation={90}
    />
    <A_0603WAF1003T5E
      name="R_USB_BOOST_OFF_PULLDOWN"
      schSectionName={schSections.power}
      pcbX={50}
      pcbY={53}
      pcbRotation={90}
    />
    <AO3401A
      name="Q_BAT_CUTOFF"
      schSectionName={schSections.power}
      pcbX={7}
      pcbY={56}
      pcbRotation={0}
    />
    <A_0603WAF1003T5E
      name="R_BAT_GATE_PULLUP"
      schSectionName={schSections.power}
      pcbX={7}
      pcbY={61}
      pcbRotation={90}
    />
    <A_0603WAF1003T5E
      name="R_BAT_GATE_BASE"
      schSectionName={schSections.power}
      pcbX={4}
      pcbY={61}
      pcbRotation={90}
    />
    <MMBT3904_RANGE_100_300_
      name="Q_BAT_GATE"
      schSectionName={schSections.power}
      pcbX={1}
      pcbY={61}
      pcbRotation={0}
    />
    <MMBT3904_RANGE_100_300_
      name="Q_USB_BOOST_OFF"
      schSectionName={schSections.power}
      pcbX={47}
      pcbY={53}
      pcbRotation={0}
    />
    <KH_6X6X15H_SMT_FS_D name="SW_UP" schSectionName={schSections.controls} pcbX={-28} pcbY={-27} />
    <KH_6X6X15H_SMT_FS_D name="SW_DOWN" schSectionName={schSections.controls} pcbX={-28} pcbY={-45} />
    <KH_6X6X15H_SMT_FS_D name="SW_LEFT" schSectionName={schSections.controls} pcbX={-37} pcbY={-36} />
    <KH_6X6X15H_SMT_FS_D name="SW_RIGHT" schSectionName={schSections.controls} pcbX={-19} pcbY={-36} />
    <KH_6X6X15H_SMT_FS_D name="SW_A" schSectionName={schSections.controls} pcbX={37} pcbY={-36} />
    <KH_6X6X15H_SMT_FS_D name="SW_B" schSectionName={schSections.controls} pcbX={28} pcbY={-45} />
    <KH_6X6X15H_SMT_FS_D name="SW_X" schSectionName={schSections.controls} pcbX={28} pcbY={-27} />
    <KH_6X6X15H_SMT_FS_D name="SW_Y" schSectionName={schSections.controls} pcbX={19} pcbY={-36} />
    <KH_6X6X15H_SMT_FS_D name="SW_SELECT" schSectionName={schSections.controls} pcbX={-7} pcbY={-56} />
    <KH_6X6X15H_SMT_FS_D name="SW_START" schSectionName={schSections.controls} pcbX={8} pcbY={-56} />
    <SM02B_PASS_TBT_LF__SN_
      name="J_SPK"
      schSectionName={schSections.audio}
      pcbX={0}
      pcbY={0}
      pcbRotation={0}
    />
    <PAM8403DR_H
      name="U_SPK_AMP"
      schSectionName={schSections.audio}
      pcbX={0}
      pcbY={-25}
      pcbRotation={-90}
    />
    <resistor
      name="R_AMP_IN"
      schSectionName={schSections.audio}
      resistance="1k"
      footprint="0402"
      pcbX={-10}
      pcbY={-20}
      pcbRotation={-90}
    />
    <capacitor
      name="C_AMP_PWM_FILTER"
      schSectionName={schSections.audio}
      capacitance="10nF"
      footprint="0402"
      schOrientation="vertical"
      pcbX={-6}
      pcbY={-20}
      pcbRotation={90}
    />
    <capacitor
      name="C_AMP_IN_COUPLE"
      schSectionName={schSections.audio}
      capacitance="1uF"
      footprint="0402"
      schOrientation="vertical"
      pcbX={-7}
      pcbY={-16}
      pcbRotation={0}
    />
    <RK10J12E002L
      name="RV_VOLUME"
      schSectionName={schSections.audio}
      pcbX={-46.4}
      pcbY={-8}
      pcbRotation={90}
    />
    <capacitor
      name="C_AMP_VDD"
      schSectionName={schSections.audio}
      capacitance="1uF"
      footprint="0402"
      schOrientation="vertical"
      pcbX={5}
      pcbY={-25}
      pcbRotation={-90}
    />
    <capacitor
      name="C_AMP_VDD_BULK"
      schSectionName={schSections.audio}
      capacitance="22uF"
      footprint="0603"
      schOrientation="vertical"
      pcbX={15}
      pcbY={-31}
      pcbRotation={-90}
    />
    <capacitor
      name="C_AMP_VREF"
      schSectionName={schSections.audio}
      capacitance="1uF"
      footprint="0402"
      schOrientation="vertical"
      pcbX={-6}
      pcbY={-25}
      pcbRotation={90}
    />
    <BLM18PG121SN1D
      name="FB_SPK_POS"
      schSectionName={schSections.audio}
      pcbX={-4}
      pcbY={-9}
      pcbRotation={90}
    />
    <BLM18PG121SN1D
      name="FB_SPK_NEG"
      schSectionName={schSections.audio}
      pcbX={4}
      pcbY={-9}
      pcbRotation={90}
    />
    <capacitor
      name="C_SPK_EMI_POS"
      schSectionName={schSections.audio}
      capacitance="220pF"
      footprint="0402"
      schOrientation="vertical"
      pcbX={-7}
      pcbY={-5}
      pcbRotation={90}
    />
    <capacitor
      name="C_SPK_EMI_NEG"
      schSectionName={schSections.audio}
      capacitance="220pF"
      footprint="0402"
      schOrientation="vertical"
      pcbX={7}
      pcbY={-5}
      pcbRotation={90}
    />

    <trace name="UP" from=".SW_UP > .pin1" to=".PICO .J_LEFT > .GP2" />
    <trace name="UP_G" from=".SW_UP > .pin4" to="net.GND" {...gndLabel} />
    <trace name="DN" from=".SW_DOWN > .pin1" to=".PICO .J_LEFT > .GP3" />
    <trace name="DN_G" from=".SW_DOWN > .pin4" to="net.GND" {...gndLabel} />
    <trace name="LFT" from=".SW_LEFT > .pin1" to=".PICO .J_LEFT > .GP4" />
    <trace name="LFT_G" from=".SW_LEFT > .pin4" to="net.GND" {...gndLabel} />
    <trace name="RGT" from=".SW_RIGHT > .pin1" to=".PICO .J_LEFT > .GP5" />
    <trace name="RGT_G" from=".SW_RIGHT > .pin4" to="net.GND" {...gndLabel} />
    <trace name="A" from=".SW_A > .pin1" to=".PICO .J_LEFT > .GP6" />
    <trace name="A_G" from=".SW_A > .pin4" to="net.GND" {...gndLabel} />
    <trace name="B" from=".SW_B > .pin1" to=".PICO .J_LEFT > .GP7" />
    <trace name="B_G" from=".SW_B > .pin4" to="net.GND" {...gndLabel} />
    <trace name="X" from=".SW_X > .pin1" to=".PICO .J_LEFT > .GP8" />
    <trace name="X_G" from=".SW_X > .pin4" to="net.GND" {...gndLabel} />
    <trace name="Y" from=".SW_Y > .pin1" to=".PICO .J_LEFT > .GP9" />
    <trace name="Y_G" from=".SW_Y > .pin4" to="net.GND" {...gndLabel} />
    <trace name="SEL" from=".SW_SELECT > .pin1" to=".PICO .J_LEFT > .GP10" />
    <trace name="SEL_G" from=".SW_SELECT > .pin4" to="net.GND" {...gndLabel} />
    <trace name="STA" from=".SW_START > .pin1" to=".PICO .J_LEFT > .GP11" />
    <trace name="STA_G" from=".SW_START > .pin4" to="net.GND" {...gndLabel} />

    <trace name="LCD_VCC" from=".J_LCD .J_HEADER > .VCC" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="LCD_GND" from=".J_LCD .J_HEADER > .GND" to="net.GND" {...gndLabel} />
    <trace name="LCD_CS" from=".J_LCD .J_HEADER > .CS" to=".PICO .J_RIGHT > .GP17" />
    <trace name="LCD_RST" from=".J_LCD .J_HEADER > .RESET" to=".PICO .J_RIGHT > .GP21" />
    <trace name="LCD_DC" from=".J_LCD .J_HEADER > .DC_RS" to=".PICO .J_RIGHT > .GP20" />
    <trace name="LCD_MOSI" from=".J_LCD .J_HEADER > .SDI_MOSI" to=".PICO .J_RIGHT > .GP19" />
    <trace name="LCD_SCK" from=".J_LCD .J_HEADER > .SCK" to=".PICO .J_RIGHT > .GP18" />
    <trace name="LCD_LED" from=".J_LCD .J_HEADER > .LED" to="net.V3V3" {...v3v3Label} />
    <trace name="LCD_MISO" from=".J_LCD .J_HEADER > .SDO_MISO" to=".PICO .J_RIGHT > .GP16" />
    <trace name="SPK_PWM" from=".PICO .J_LEFT > .GP12" to=".R_AMP_IN > .pin1" {...denseTraceProps} />
    <trace name="AMP_PWM_FILTER" from=".R_AMP_IN > .pin2" to=".C_AMP_PWM_FILTER > .pin1" {...denseTraceProps} />
    <trace name="AMP_PWM_FILTER_G" from=".C_AMP_PWM_FILTER > .pin2" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="VOL_IN" from=".R_AMP_IN > .pin2" to=".RV_VOLUME > .pin3" {...denseTraceProps} />
    <trace name="VOL_WIPER" from=".RV_VOLUME > .pin2" to=".C_AMP_IN_COUPLE > .pin1" {...denseTraceProps} />
    <trace name="VOL_GND" from=".RV_VOLUME > .pin1" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="AMP_IN_L" from=".C_AMP_IN_COUPLE > .pin2" to=".U_SPK_AMP > .INL" {...denseTraceProps} />
    <trace name="AMP_IN_R_GND" from=".U_SPK_AMP > .INR" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="AMP_MUTE" from=".U_SPK_AMP > .MUTE" to="net.V3V3" {...denseTraceProps} {...v3v3Label} />
    <trace name="AMP_SHUTDOWN" from=".U_SPK_AMP > .SHND" to="net.V3V3" {...denseTraceProps} {...v3v3Label} />
    <trace name="AMP_VDD" from=".U_SPK_AMP > .VDD" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="AMP_PVDD_L" from=".U_SPK_AMP > .PVDD1" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="AMP_PVDD_R" from=".U_SPK_AMP > .PVDD2" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="AMP_GND" from=".U_SPK_AMP > .GND" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="AMP_PGND_L" from=".U_SPK_AMP > .PGND1" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="AMP_PGND_R" from=".U_SPK_AMP > .PGND2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="AMP_DECOUPLE_VDD" from=".C_AMP_VDD > .pin1" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="AMP_DECOUPLE_GND" from=".C_AMP_VDD > .pin2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="AMP_BULK_VDD" from=".C_AMP_VDD_BULK > .pin1" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="AMP_BULK_GND" from=".C_AMP_VDD_BULK > .pin2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="AMP_VREF" from=".U_SPK_AMP > .VREF" to=".C_AMP_VREF > .pin1" {...denseTraceProps} />
    <trace name="AMP_VREF_GND" from=".C_AMP_VREF > .pin2" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="AMP_OUT_POS_RAW" from=".U_SPK_AMP > .OUT_L_POS" to=".FB_SPK_POS > .pin1" {...speakerTraceProps} />
    <trace name="AMP_OUT_POS_FILT" from=".FB_SPK_POS > .pin2" to=".J_SPK > .pin1" {...speakerTraceProps} />
    <trace name="AMP_OUT_POS_EMI" from=".FB_SPK_POS > .pin2" to=".C_SPK_EMI_POS > .pin1" {...speakerTraceProps} />
    <trace name="SPK_EMI_POS_G" from=".C_SPK_EMI_POS > .pin2" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="AMP_OUT_NEG_RAW" from=".U_SPK_AMP > .OUT_L_NEG" to=".FB_SPK_NEG > .pin1" {...speakerTraceProps} />
    <trace name="AMP_OUT_NEG_FILT" from=".FB_SPK_NEG > .pin2" to=".J_SPK > .pin2" {...speakerTraceProps} />
    <trace name="AMP_OUT_NEG_EMI" from=".FB_SPK_NEG > .pin2" to=".C_SPK_EMI_NEG > .pin1" {...speakerTraceProps} />
    <trace name="SPK_EMI_NEG_G" from=".C_SPK_EMI_NEG > .pin2" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="SPK_SHIELD_L" from=".J_SPK > .pin3" to="net.GND" {...denseTraceProps} {...gndLabel} />
    <trace name="SPK_SHIELD_R" from=".J_SPK > .pin4" to="net.GND" {...denseTraceProps} {...gndLabel} />

    <trace name="BAT+" from=".J_BAT > .pin1" to=".J_PWR_SW > .pin2" {...batteryTraceProps} />
    <trace name="BAT_SW" from=".J_PWR_SW > .pin1" to=".Q_BAT_CUTOFF > .S" {...powerTraceProps} />
    <trace name="BOOST_EN_PULLUP_IN" from=".J_PWR_SW > .pin1" to=".R_BOOST_EN_PULLUP > .pin1" />
    <trace name="BOOST_EN" from=".R_BOOST_EN_PULLUP > .pin2" to=".U_BAT_BOOST > .EN" />
    <trace name="BOOST_EN_OFF_C" from=".Q_USB_BOOST_OFF > .C" to=".U_BAT_BOOST > .EN" />
    <trace name="BOOST_EN_OFF_E" from=".Q_USB_BOOST_OFF > .E" to="net.GND" {...gndLabel} />
    <trace name="USB_BOOST_OFF_R" from=".PICO .J_RIGHT > .VBUS" to=".R_USB_BOOST_OFF > .pin1" {...vbusLabel} />
    <trace name="USB_BOOST_OFF_B" from=".R_USB_BOOST_OFF > .pin2" to=".Q_USB_BOOST_OFF > .B" />
    <trace name="USB_BOOST_OFF_B_PD" from=".Q_USB_BOOST_OFF > .B" to=".R_USB_BOOST_OFF_PULLDOWN > .pin1" />
    <trace name="USB_BOOST_OFF_PD_G" from=".R_USB_BOOST_OFF_PULLDOWN > .pin2" to="net.GND" {...gndLabel} />
    <trace name="BAT_CUTOFF_OUT" from=".Q_BAT_CUTOFF > .D" to=".U_BAT_BOOST > .IN" {...powerTraceProps} />
    <trace name="BAT_GATE_PULLUP_IN" from=".J_PWR_SW > .pin1" to=".R_BAT_GATE_PULLUP > .pin1" />
    <trace name="BAT_GATE_PULLUP" from=".R_BAT_GATE_PULLUP > .pin2" to=".Q_BAT_CUTOFF > .G" />
    <trace name="BAT_GATE_PULLDOWN" from=".Q_BAT_GATE > .C" to=".Q_BAT_CUTOFF > .G" />
    <trace name="BAT_GATE_G" from=".Q_BAT_GATE > .E" to="net.GND" {...gndLabel} />
    <trace name="BAT_GATE_BASE_R" from=".U_BAT_BOOST > .EN" to=".R_BAT_GATE_BASE > .pin1" />
    <trace name="BAT_GATE_BASE" from=".R_BAT_GATE_BASE > .pin2" to=".Q_BAT_GATE > .B" />
    <trace name="BOOST_L_IN" from=".Q_BAT_CUTOFF > .D" to=".L_BAT_BOOST > .pin1" {...powerTraceProps} />
    <trace name="BOOST_L_SW" from=".L_BAT_BOOST > .pin2" to=".U_BAT_BOOST > .SW" {...powerTraceProps} />
    <trace name="BOOST_D_SW" from=".U_BAT_BOOST > .SW" to=".D_BAT_BOOST > .anode" {...powerTraceProps} />
    <trace name="BOOST_VSYS" from=".D_BAT_BOOST > .cathode" to="net.VSYS" {...powerTraceProps} {...vsysLabel} />
    <trace name="BOOST_G" from=".U_BAT_BOOST > .GND" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="BOOST_IN_CAP" from=".C_BAT_IN > .pin1" to=".Q_BAT_CUTOFF > .D" {...powerTraceProps} />
    <trace name="BOOST_IN_CAP_G" from=".C_BAT_IN > .pin2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="BOOST_IN_BULK" from=".C_BAT_IN_BULK > .pin1" to=".Q_BAT_CUTOFF > .D" {...powerTraceProps} />
    <trace name="BOOST_IN_BULK_G" from=".C_BAT_IN_BULK > .pin2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="BOOST_OUT_CAP" from=".C_BAT_OUT > .pin1" to=".D_BAT_BOOST > .cathode" {...powerTraceProps} />
    <trace name="BOOST_OUT_CAP_G" from=".C_BAT_OUT > .pin2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="BOOST_OUT_BULK" from=".C_BAT_OUT_BULK > .pin1" to=".D_BAT_BOOST > .cathode" {...powerTraceProps} />
    <trace name="BOOST_OUT_BULK_G" from=".C_BAT_OUT_BULK > .pin2" to="net.GND" {...powerTraceProps} {...gndLabel} />
    <trace name="BOOST_FB_TOP" from=".D_BAT_BOOST > .cathode" to=".R_BOOST_TOP > .pin1" />
    <trace name="BOOST_FB" from=".R_BOOST_TOP > .pin2" to=".U_BAT_BOOST > .FB" />
    <trace name="BOOST_FB_BOT" from=".U_BAT_BOOST > .FB" to=".R_BOOST_BOT > .pin1" />
    <trace name="BOOST_FB_G" from=".R_BOOST_BOT > .pin2" to="net.GND" {...gndLabel} />
    <trace name="BAT_G" from=".J_BAT > .pin2" to="net.GND" {...gndLabel} />
    <trace name="SW_G" from=".J_PWR_SW > .pin4" to="net.GND" {...gndLabel} />
    <trace name="SW_G2" from=".J_PWR_SW > .pin5" to="net.GND" {...gndLabel} />
    <trace name="PICO_G" from="net.GND" to=".PICO net.GND" {...gndLabel} />
    <trace name="PICO_3V3" from="net.V3V3" to=".PICO net.V3V3" {...v3v3Label} />

    <copperpour
      name="GND_POUR_TOP"
      connectsTo="net.GND"
      layer="top"
      clearance="0.18mm"
      boardEdgeMargin="0.25mm"
    />
    <copperpour
      name="GND_POUR_BOTTOM"
      connectsTo="net.GND"
      layer="bottom"
      clearance="0.18mm"
      boardEdgeMargin="0.25mm"
    />

    <silkscreentext text="LCDWIKI 2.8 SPI" fontSize="1.2mm" pcbX={0} pcbY={54} />
    <silkscreentext text="BAT" fontSize="0.9mm" pcbX={-40} pcbY={55} pcbRotation={90} />
    <silkscreentext text="USB PRIMARY / 3xAA" fontSize="0.9mm" pcbX={26} pcbY={50} />
    <silkscreentext text="PWR SW" fontSize="0.9mm" pcbX={46} pcbY={20} pcbRotation={90} />
    <silkscreentext text="UP" fontSize="0.9mm" pcbX={-28} pcbY={-23} />
    <silkscreentext text="DOWN" fontSize="0.9mm" pcbX={-28} pcbY={-41} />
    <silkscreentext text="LEFT" fontSize="0.9mm" pcbX={-37} pcbY={-32} />
    <silkscreentext text="RIGHT" fontSize="0.9mm" pcbX={-19} pcbY={-32} />
    <silkscreentext text="A" fontSize="0.9mm" pcbX={37} pcbY={-32} />
    <silkscreentext text="B" fontSize="0.9mm" pcbX={28} pcbY={-41} />
    <silkscreentext text="X" fontSize="0.9mm" pcbX={28} pcbY={-23} />
    <silkscreentext text="Y" fontSize="0.9mm" pcbX={19} pcbY={-32} />
    <silkscreentext text="SELECT" fontSize="0.9mm" pcbX={-7} pcbY={-52} />
    <silkscreentext text="START" fontSize="0.9mm" pcbX={8} pcbY={-52} />
    <silkscreentext text="SPK" fontSize="0.9mm" pcbX={0} pcbY={-2} />
  </board>
)
