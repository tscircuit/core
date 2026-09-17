import { A_0402WGF4702TCE } from "./components/A_0402WGF4702TCE"
import { A_0402WGF5101TCE } from "./components/A_0402WGF5101TCE"
import { A_2_54_1_3 } from "./components/A_2_54_1_3"
import { BLM18SG121TN1D } from "./components/BLM18SG121TN1D"
import { CL05A105KA5NQNC } from "./components/CL05A105KA5NQNC"
import { CL05A474KP5NNNC } from "./components/CL05A474KP5NNNC"
import { CR0402FF33R0G } from "./components/CR0402FF33R0G"
import { FRC0402F2400TS } from "./components/FRC0402F2400TS"
import { HroMicroSd } from "./components/HroMicroSd"
import { HroUsbC } from "./components/HroUsbC"
import { LT8912B } from "./components/LT8912B"
import { OT1EL89CJI_111YLC_25M } from "./components/OT1EL89CJI_111YLC_25M"
import { RY1303 } from "./components/RY1303"
import { SMAJ5_0A } from "./components/SMAJ5_0A"
import { SMD1812P110TF } from "./components/SMD1812P110TF"
import { T113S3 } from "./components/T113S3"
import { TLV76718DGNR } from "./components/TLV76718DGNR"
import { TPS3808G01DBVR } from "./components/TPS3808G01DBVR"
import { USBLC6_2SC6 } from "./components/USBLC6_2SC6"
import { X322524MRB4SI } from "./components/X322524MRB4SI"
import {
  Coilcraft2u2H4020,
  Samsung22uF1206,
  Yageo45k3Ohm0603,
} from "./components/buck-passives"
import {
  Coilcraft1uH4020,
  Yageo100kOhm0603,
} from "./components/buck09-passives"
import {
  Coilcraft1u5H4020,
  Yageo33k2Ohm0603,
  Yageo49k9Ohm0603,
} from "./components/buck15-passives"
import { localPartsEngine } from "./components/local-parts-engine"
import { Yageo2n2F0402, Yageo6k04Ohm0603 } from "./components/lt8912b-support"
import { Samsung22pF0402 } from "./components/samsung-additional0402"
import { Samsung2u2F0402, Samsung100nF0402 } from "./components/samsung0402"
import {
  Yageo10k2Ohm0603,
  Yageo66k5Ohm0603,
} from "./components/supervisor-precision-resistors"
import {
  UniRoyal100kOhm0402,
  Yageo10kOhm0402,
  Yageo31k6Ohm0603,
} from "./components/supervisor-resistors"
import { Yageo10k5Ohm0603 } from "./components/supervisor09-resistors"
import { Yageo24kOhm0603 } from "./components/supervisor15-resistors"
import {
  Murata10uF0805,
  Samsung4u7F0805,
  UniRoyal1k5Ohm0402,
} from "./components/supply-passives"

// Batch 19: added U9, R31, C45, Y2 and FB1 (five physical components).
// U3 releases EN_3V3 after the 1.8 V rail is valid; CT open gives 12–28 ms delay.
// V5VIN is an unpowered input net until the USB/power connector is added.
// 1.8 V comes up first; later 3.3/1.5/0.9 V rails require supervised sequencing.
// Exact supplier footprints now used for U1 and all capacitors.
// No manual copper paths, route hints, breakout points, or vias are specified.
// User waived arbitrary decoupling length limits. The current props API has no
// unlimited option; a finite JSON-safe maximum avoids its automatic 1 mm guard.
export default () => (
  <board
    width="120mm"
    height="72mm"
    layers={4}
    partsEngine={localPartsEngine}
    autorouterVersion="beta_pipeline9"
    autorouterEffortLevel="1x"
    enableViaStitching={false}
    minTraceWidth="0.1mm"
    defaultTraceWidth="0.1mm"
    minTraceToPadEdgeClearance="0.1mm"
    minViaEdgeToPadEdgeClearance="0.1mm"
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.45mm"
  >
    <schematicsheet
      name="S1"
      displayName="T113-S3 Linux board — staged construction"
    />
    <net name="EN_3V3" nominalTraceWidth="0.15mm" />
    <net name="EN_1V5" nominalTraceWidth="0.15mm" />
    <net name="EN_0V9" nominalTraceWidth="0.15mm" />
    <net name="SOC_RESET_N" nominalTraceWidth="0.15mm" />
    <net name="SD_DAT0" nominalTraceWidth="0.15mm" />
    <net name="SD_DAT1" nominalTraceWidth="0.15mm" />
    <net name="SD_DAT2" nominalTraceWidth="0.15mm" />
    <net name="SD_DAT3" nominalTraceWidth="0.15mm" />
    <net name="SD_CMD" nominalTraceWidth="0.15mm" />
    <net name="SD_CLK" nominalTraceWidth="0.15mm" />
    <net name="SD_CARD_DETECT" nominalTraceWidth="0.15mm" />
    <net name="UART3_TX" nominalTraceWidth="0.15mm" />
    <net name="UART3_RX" nominalTraceWidth="0.15mm" />
    <net name="USB0_DP" nominalTraceWidth="0.15mm" />
    <net name="USB0_DM" nominalTraceWidth="0.15mm" />
    <net name="V5VIN" isPowerNet nominalTraceWidth="0.4mm" />
    <net name="V1V8_FIRST" isPowerNet nominalTraceWidth="0.25mm" />
    <net name="V1V8_HDMI" isPowerNet nominalTraceWidth="0.1mm" />
    <net name="V3V3" isPowerNet nominalTraceWidth="0.4mm" />
    <net name="V1V5_DRAM" isPowerNet nominalTraceWidth="0.4mm" />
    <net name="V0V9_CORE" isPowerNet nominalTraceWidth="0.4mm" />
    <net name="GND" />
    <copperpour layer="inner1" connectsTo="net.GND" />
    <fanout name="SOC" autorouter="auto" padding="1.2mm" pcbX={0} pcbY={0}>
      <T113S3 />
      <trace from="U1.VCC_PLL" to="net.V1V8_FIRST" />
      <trace from="U1.VCC_RTC" to="net.V1V8_FIRST" />
      <trace from="U1.VDD18_DRAM" to="net.V1V8_FIRST" />
      <trace from="U1.VCC_LVDS" to="net.V1V8_FIRST" />
      <trace from="U1.AVCC" to="net.V1V8_FIRST" />
      <trace from="U1.HPVCC" to="net.V1V8_FIRST" />
      <trace from="U1.VCC_TVIN" to="net.V1V8_FIRST" />

      <trace from="U1.GND" to="net.GND" />
      <trace from="U1.AGND" to="net.GND" />
      <trace from="U1.LDO_IN" to="net.V3V3" />
      <trace from="U1.VCC_PE" to="net.V3V3" />
      <trace from="U1.VCC_PD" to="net.V3V3" />
      <trace from="U1.VCC_TVOUT" to="net.V3V3" />
      <trace from="U1.VCC_IO" to="net.V3V3" />
      <trace from="U1.VCC_PG" to="net.V3V3" />
      <trace from="U1.VCC_PE" to="U1.VCC_PD" />
      <trace from="U1.VCC_DRAM0" to="net.V1V5_DRAM" />
      <trace from="U1.VDD_SYS0" to="net.V0V9_CORE" />
      <trace from="U1.VDD_SYS1" to="net.V0V9_CORE" />
      <trace from="U1.VDD_SYS2" to="net.V0V9_CORE" />
      <trace from="U1.VDD_CORE0" to="net.V0V9_CORE" />
      <trace from="U1.VDD_CORE1" to="net.V0V9_CORE" />
      <trace from="U1.RESET" to="net.SOC_RESET_N" />
      <trace from="U1.PF0" to="net.SD_DAT1" />
      <trace from="U1.PF1" to="net.SD_DAT0" />
      <trace from="U1.PF3" to="net.SD_CMD" />
      <trace from="U1.PF4" to="net.SD_DAT3" />
      <trace from="U1.PF5" to="net.SD_DAT2" />
      <trace from="U1.PF6" to="net.SD_CARD_DETECT" />
      <trace from="U1.PB6" to="net.UART3_TX" />
      <trace from="U1.PB7" to="net.UART3_RX" />
      <trace from="U1.USB0_DP" to="net.USB0_DP" />
      <trace from="U1.USB0_DM" to="net.USB0_DM" />
      <CR0402FF33R0G
        name="R22"
        pcbX={-10.5}
        pcbY={6.5}
        pcbRotation={90}
        schX={-8}
        schY={-10}
        connections={{ pin1: "U1.PF2", pin2: "net.SD_CLK" }}
      />
      <Samsung2u2F0402
        name="C1"
        pcbX={-14.8}
        pcbY={-6.3}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-14}
        schY={5}
        connections={{ pin1: "U1.LDOA_OUT", pin2: "net.GND" }}
      />
      <Samsung2u2F0402
        name="C2"
        pcbX={-14.8}
        pcbY={-8}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-14}
        schY={2}
        connections={{ pin1: "U1.LDO_IN", pin2: "net.GND" }}
      />
      <Samsung2u2F0402
        name="C3"
        pcbX={-14.8}
        pcbY={-9.7}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-14}
        schY={-1}
        connections={{ pin1: "U1.LDOB_OUT", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C4"
        pcbX={-1}
        pcbY={-10.2}
        pcbRotation={270}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-14}
        schY={-4}
        connections={{ pin1: "U1.VDD_SYS0", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C5"
        pcbX={1}
        pcbY={-10.2}
        pcbRotation={270}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-14}
        schY={-7}
        connections={{ pin1: "U1.VDD_SYS1", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C6"
        pcbX={10.2}
        pcbY={0.2}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={14}
        schY={8}
        connections={{ pin1: "U1.VDD_SYS2", pin2: "net.GND" }}
      />
      <trace from="C5.pin1" to="C6.pin1" />
      <Samsung100nF0402
        name="C7"
        pcbX={-0.7}
        pcbY={10.2}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={14}
        schY={5}
        connections={{ pin1: "U1.VDD_CORE0", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C8"
        pcbX={-2.5}
        pcbY={10.2}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={14}
        schY={2}
        connections={{ pin1: "U1.VDD_CORE1", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C9"
        pcbX={-0.2}
        pcbY={-4.8}
        layer="bottom"
        pcbRotation={270}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={14}
        schY={-1}
        connections={{ pin1: "U1.VCC_DRAM0", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C10"
        pcbX={-2.5}
        pcbY={-4}
        layer="bottom"
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={14}
        schY={-4}
        connections={{ pin1: "U1.VCC_DRAM1", pin2: "net.GND" }}
      />
      <trace from="C9.pin1" to="C10.pin1" />
      <Samsung100nF0402
        name="C11"
        pcbX={2}
        pcbY={-4.8}
        layer="bottom"
        pcbRotation={270}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={18}
        schY={8}
        connections={{ pin1: "U1.VDD18_DRAM", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C12"
        pcbX={-10.2}
        pcbY={3.2}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={18}
        schY={5}
        connections={{ pin1: "U1.VCC_PLL", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C13"
        pcbX={-5}
        pcbY={-3}
        layer="bottom"
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={18}
        schY={2}
        connections={{ pin1: "U1.VCC_RTC", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C14"
        pcbX={10.2}
        pcbY={1.9}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={18}
        schY={-1}
        connections={{ pin1: "U1.VCC_IO", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C15"
        pcbX={-5.8}
        pcbY={-10.2}
        pcbRotation={270}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={18}
        schY={-4}
        connections={{ pin1: "U1.VCC_PE", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C16"
        pcbX={10.2}
        pcbY={-5.8}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={22}
        schY={8}
        connections={{ pin1: "U1.VCC_PD", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C17"
        pcbX={-6.2}
        pcbY={10.2}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={22}
        schY={5}
        connections={{ pin1: "U1.VCC_PG", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C18"
        pcbX={5}
        pcbY={-5.5}
        layer="bottom"
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={22}
        schY={2}
        connections={{ pin1: "U1.VCC_LVDS", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C19"
        pcbX={10.2}
        pcbY={3.6}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={22}
        schY={-1}
        connections={{ pin1: "U1.AVCC", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C20"
        pcbX={6.2}
        pcbY={10.2}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={22}
        schY={-4}
        connections={{ pin1: "U1.HPVCC", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C21"
        pcbX={10.2}
        pcbY={-3.2}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={26}
        schY={8}
        connections={{ pin1: "U1.VCC_TVOUT", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C22"
        pcbX={2.2}
        pcbY={10.2}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={26}
        schY={5}
        connections={{ pin1: "U1.VCC_TVIN", pin2: "net.GND" }}
      />
      <CL05A474KP5NNNC
        name="C23"
        pcbX={10.2}
        pcbY={5.3}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={26}
        schY={2}
        connections={{ pin1: "U1.VRA1", pin2: "net.GND" }}
      />
      <CL05A474KP5NNNC
        name="C24"
        pcbX={5}
        pcbY={3.5}
        layer="bottom"
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={26}
        schY={-1}
        connections={{ pin1: "U1.VRA2", pin2: "net.GND" }}
      />
      <CL05A105KA5NQNC
        name="C25"
        pcbX={1}
        pcbY={5.4}
        layer="bottom"
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={26}
        schY={-4}
        connections={{ pin1: "U1.TVIN_VRP", pin2: "net.GND" }}
      />
      <CL05A105KA5NQNC
        name="C26"
        pcbX={-1.5}
        pcbY={5.4}
        layer="bottom"
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={30}
        schY={8}
        connections={{ pin1: "U1.TVIN_VRN", pin2: "net.GND" }}
      />
      <FRC0402F2400TS
        name="R1"
        pcbX={-4.8}
        pcbY={-5}
        layer="bottom"
        pcbRotation={90}
        schX={30}
        schY={5}
        connections={{ pin1: "U1.DZQ", pin2: "net.GND" }}
      />
      <X322524MRB4SI
        name="Y1"
        pcbX={-11.7}
        pcbY={-2.5}
        schX={-20}
        schY={0}
        connections={{
          pin1: "U1.DXIN",
          pin3: "U1.DXOUT",
          pin2: "net.GND",
          pin4: "net.GND",
        }}
      />
      <Samsung22pF0402
        name="C27"
        pcbX={-16.5}
        pcbY={-4.2}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-22}
        schY={-3}
        connections={{ pin1: "Y1.X1", pin2: "net.GND" }}
      />
      <Samsung22pF0402
        name="C28"
        pcbX={-10.6}
        pcbY={0.7}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-18}
        schY={-3}
        connections={{ pin1: "Y1.X2", pin2: "net.GND" }}
      />
    </fanout>
    <fanout
      name="REG18"
      autorouter="auto"
      padding="1.2mm"
      pcbX={-44}
      pcbY={-20}
    >
      <TLV76718DGNR
        name="U2"
        pcbX={0}
        pcbY={0}
        pcbRotation={0}
        schX={-26}
        schY={-12}
        connections={{
          IN: "net.V5VIN",
          EN: "U2.IN",
          OUT: "net.V1V8_FIRST",
          SNS: "U2.OUT",
          GND1: "net.GND",
          GND2: "net.GND",
          EP_GND: "net.GND",
        }}
      />
      <Murata10uF0805
        name="C29"
        pcbX={-6}
        pcbY={-1}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-31}
        schY={-12}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="C29.pin1" to="U2.IN" thickness="0.4mm" />
      <Murata10uF0805
        name="C30"
        pcbX={6}
        pcbY={-1}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-21}
        schY={-12}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="C30.pin1" to="U2.OUT" thickness="0.4mm" />
      <UniRoyal1k5Ohm0402
        name="R2"
        pcbX={6}
        pcbY={2.5}
        schX={-18}
        schY={-12}
        connections={{ pin1: "U2.OUT", pin2: "net.GND" }}
      />
    </fanout>
    <Samsung4u7F0805
      name="C31"
      pcbX={5.5}
      pcbY={0.7}
      layer="bottom"
      maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
      schX={30}
      schY={2}
      connections={{ pin1: "net.V1V8_FIRST", pin2: "net.GND" }}
    />
    <fanout name="SUP18" autorouter="auto" padding="1.2mm" pcbX={-26} pcbY={-9}>
      <TPS3808G01DBVR
        name="U3"
        pcbX={0}
        pcbY={0}
        schX={-26}
        schY={-20}
        connections={{
          VDD: "net.V5VIN",
          GND: "net.GND",
          MR_N: "net.V5VIN",
          RESET_N: "net.EN_3V3",
        }}
      />
      <Yageo31k6Ohm0603
        name="R3"
        pcbX={-4.2}
        pcbY={2.7}
        schX={-31}
        schY={-18}
        connections={{ pin1: "net.V1V8_FIRST", pin2: "U3.SENSE" }}
      />
      <Yageo10kOhm0402
        name="R4"
        pcbX={-4.2}
        pcbY={5}
        pcbRotation={90}
        schX={-31}
        schY={-22}
        connections={{ pin1: "U3.SENSE", pin2: "net.GND" }}
      />
      <UniRoyal100kOhm0402
        name="R5"
        pcbX={4}
        pcbY={-1}
        schX={-21}
        schY={-18}
        connections={{ pin1: "U3.RESET_N", pin2: "net.V5VIN" }}
      />
      <Samsung100nF0402
        name="C32"
        pcbX={-4}
        pcbY={-1.5}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-21}
        schY={-22}
        connections={{ pin1: "U3.VDD", pin2: "net.GND" }}
      />
    </fanout>
    <fanout
      name="BUCK"
      autorouter="auto"
      padding="2mm"
      pcbX={27.3}
      pcbY={-14.3}
    >
      <RY1303
        name="U4"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={-20}
        connections={{
          GND3: "net.GND",
          GND2A: "net.GND",
          GND2B: "net.GND",
          GND1A: "net.GND",
          GND1B: "net.GND",
          AGNDA: "net.GND",
          AGNDB: "net.GND",
          EP_GND: "net.GND",
          VIN1: "net.V5VIN",
          VIN2: "net.V5VIN",
          EN1: "net.EN_3V3",
          EN2: "net.EN_1V5",
          EN3: "net.EN_0V9",
        }}
      />
      <trace from="U4.GND3" to="U4.GND2A" />
      <trace from="U4.GND2A" to="U4.GND2B" />
      <trace from="U4.GND1A" to="U4.GND1B" />
      <trace from="U4.GND1B" to="U4.AGNDA" />
      <trace from="U4.AGNDA" to="U4.AGNDB" />
      <trace from="U4.AGNDB" to="U4.EP_GND" />
      <trace from="U4.VIN3" to="U4.VIN2" thickness="0.2mm" />
      <trace from="U4.VIN1" to="U4.VIN2" thickness="0.2mm" />
      <Coilcraft2u2H4020
        name="L1"
        pcbX={5}
        pcbY={0}
        schX={6}
        schY={-18}
        connections={{ pin1: "U4.SW1", pin2: "net.V3V3" }}
      />
      <Samsung22uF1206
        name="C33"
        pcbX={8.7}
        pcbY={1}
        pcbRotation={90}
        schX={12}
        schY={-18}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <trace from="C33.pin2" to="U4.GND2B" />
      <trace from="U4.GND2B" to="U4.GND1A" />
      <Yageo45k3Ohm0603
        name="R6"
        pcbX={0}
        pcbY={4}
        pcbRotation={180}
        schX={6}
        schY={-22}
        connections={{ pin1: "net.V3V3" }}
      />
      <Yageo10kOhm0402
        name="R7"
        pcbX={-3}
        pcbY={4}
        pcbRotation={180}
        schX={12}
        schY={-22}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="R7.pin1" to="R6.pin2" />
      <trace from="U4.FB1" to="R6.pin2" />
      <trace from="R6.pin1" to="L1.pin2" />
      <Coilcraft1u5H4020
        name="L2"
        pcbX={5.2}
        pcbY={-5}
        schX={6}
        schY={-26}
        connections={{ pin1: "U4.SW2", pin2: "net.V1V5_DRAM" }}
      />
      <Samsung22uF1206
        name="C35"
        pcbX={10.4}
        pcbY={-5}
        pcbRotation={90}
        schX={12}
        schY={-26}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="C35.pin2" to="C33.pin2" />
      <Yageo49k9Ohm0603 name="R11" pcbX={5} pcbY={-9} schX={6} schY={-30} />
      <Yageo33k2Ohm0603
        name="R12"
        pcbX={1}
        pcbY={-9}
        schX={12}
        schY={-30}
        connections={{ pin1: "net.GND" }}
      />
      <trace from="R12.pin2" to="R11.pin1" />
      <trace from="U4.FB2" to="R11.pin1" />
      <trace from="L2.pin2" to="C35.pin1" thickness="0.4mm" />
      <trace from="R11.pin2" to="L2.pin2" />
      <Murata10uF0805
        name="C36"
        pcbX={0}
        pcbY={-4}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={0}
        schY={-26}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="C36.pin1" to="U4.VIN3" thickness="0.2mm" />
      <Coilcraft1uH4020
        name="L3"
        pcbX={-5.3}
        pcbY={-0.5}
        schX={-6}
        schY={-26}
        connections={{ pin1: "U4.SW3", pin2: "net.V0V9_CORE" }}
      />
      <Samsung22uF1206
        name="C38"
        pcbX={-6.2}
        pcbY={-6}
        pcbRotation={90}
        schX={-12}
        schY={-26}
        connections={{ pin1: "net.V0V9_CORE", pin2: "net.GND" }}
      />
      <Yageo49k9Ohm0603 name="R16" pcbX={-6} pcbY={-10} schX={-6} schY={-30} />
      <Yageo100kOhm0603
        name="R17"
        pcbX={-2.4}
        pcbY={-10}
        schX={-12}
        schY={-30}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="R17.pin1" to="R16.pin2" />
      <trace from="U4.FB3" to="R16.pin2" />
      <trace from="R16.pin1" to="L3.pin2" />
      <Samsung4u7F0805
        name="C39"
        pcbX={-3.5}
        pcbY={-6}
        pcbRotation={90}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={-16}
        schY={-26}
        connections={{ pin1: "net.V0V9_CORE", pin2: "net.GND" }}
      />
      <trace from="C38.pin2" to="C39.pin2" />
      <trace from="C39.pin2" to="C36.pin2" />
    </fanout>
    <fanout name="SUP33" autorouter="auto" padding="1.2mm" pcbX={45} pcbY={10}>
      <TPS3808G01DBVR
        name="U5"
        pcbX={-2.5}
        pcbY={3.5}
        pcbRotation={180}
        schX={18}
        schY={-20}
        connections={{
          VDD: "net.V5VIN",
          GND: "net.GND",
          MR_N: "net.EN_3V3",
          RESET_N: "net.EN_1V5",
        }}
      />
      <Yageo66k5Ohm0603
        name="R8"
        pcbX={0}
        pcbY={-4}
        schX={13}
        schY={-18}
        connections={{ pin1: "net.V3V3", pin2: "U5.SENSE" }}
      />
      <Yageo10k2Ohm0603
        name="R9"
        pcbX={4.2}
        pcbY={5.5}
        pcbRotation={90}
        schX={13}
        schY={-22}
        connections={{ pin1: "U5.SENSE", pin2: "net.GND" }}
      />
      <UniRoyal100kOhm0402
        name="R10"
        pcbX={-4}
        pcbY={-1}
        schX={23}
        schY={-18}
        connections={{ pin1: "U5.RESET_N", pin2: "net.V5VIN" }}
      />
      <Samsung100nF0402
        name="C34"
        pcbX={4}
        pcbY={-1.5}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={23}
        schY={-22}
        connections={{ pin1: "U5.VDD", pin2: "net.GND" }}
      />
      <trace from="U5.GND" to="C34.pin2" />
    </fanout>
    <trace from="U4.EN1" to="U5.MR_N" />
    <trace from="U5.RESET_N" to="U4.EN2" />
    <fanout name="HDMI_BRIDGE" padding="2mm" pcbX={8} pcbY={24}>
      <LT8912B
        name="U9"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        schX={152}
        schY={0}
        noConnect={[
          "VDD2",
          "VDD3",
          "VCCA_MIPIRX",
          "VCCA_HDMITX",
          "VCCA_HDMIPLL",
          "VCCA_LVDSTX",
          "VCCA_SYSCLK",
          "VCCA_LVDSPLL",
          "VSSA_HDMITX1",
          "VSSA_HDMITX2",
          "VSS2",
          "VSSA_HDMIPLL",
          "VSSA_LVDSTX",
          "VSSA_SYSCLK",
          "VSSA_LVDSPLL",
          "VSS3",
          "GPAD",
          "REFCLK",
          "RESET_N",
        ]}
      />
      <trace name="HDMI_VDD1" from="U9.VDD1" to="FB1.OUT" />
      <trace name="HDMI_GND_MIPIRX" from="U9.VSSA_MIPIRX" to="net.GND" />
      <trace name="HDMI_GND_VSS1" from="U9.VSS1" to="net.GND" />
      <trace from="U1.PD0" to="U9.MIPIRX0_DP" />
      <trace from="U1.PD1" to="U9.MIPIRX0_DN" />
      <trace from="U1.PD2" to="U9.MIPIRX1_DP" />
      <trace from="U1.PD3" to="U9.MIPIRX1_DN" />
      <trace from="U1.PD4" to="U9.MIPIRX_CKP" />
      <trace from="U1.PD5" to="U9.MIPIRX_CKN" />
      <trace from="U1.PD6" to="U9.MIPIRX2_DP" />
      <trace from="U1.PD7" to="U9.MIPIRX2_DN" />
      <trace from="U1.PD8" to="U9.MIPIRX3_DP" />
      <trace from="U1.PD9" to="U9.MIPIRX3_DN" />
    </fanout>
    <fanout name="HDMI_R6K" padding="2mm" pcbX={21.5} pcbY={17}>
      <Yageo6k04Ohm0603
        name="R31"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        schX={164}
        schY={6}
      />
      <trace name="HDMI_R6K_SIGNAL" from="R31.pin1" to="U9.R6K" />
      <trace name="HDMI_R6K_GND" from="R31.pin2" to="net.GND" />
    </fanout>
    <Yageo2n2F0402
      name="C45"
      pcbX={21.5}
      pcbY={21.6}
      schX={164}
      schY={2}
      maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
    />
    <trace name="HDMI_LPF" from="C45.pin1" to="U9.LPF" />
    <trace name="HDMI_LPF_SUPPLY" from="C45.pin2" to="FB1.OUT" />
    <group name="HDMI_OSC" autorouter="auto" padding="2mm" pcbX={-5} pcbY={27}>
      <OT1EL89CJI_111YLC_25M name="Y2" pcbX={0} pcbY={0} schX={164} schY={-2} />
      <trace name="HDMI_OSC_ENABLE" from="Y2.ENABLE" to="Y2.VDD" />
      <trace name="HDMI_OSC_GND" from="Y2.GND" to="net.GND" />
      <trace name="HDMI_OSC_OUT" from="Y2.OUT" to="U9.XTALI" />
      <trace name="HDMI_OSC_VDD" from="Y2.VDD" to="C45.pin2" />
    </group>
    <BLM18SG121TN1D name="FB1" pcbX={21.5} pcbY={34} schX={172} schY={-4} />
    <trace name="HDMI_FB_IN" from="FB1.IN" to="C22.pin1" />
    <trace name="HDMI_FB_OUT" from="FB1.OUT" to="net.V1V8_HDMI" />
    <fanout name="SUP15" autorouter="auto" padding="1.2mm" pcbX={45} pcbY={-4}>
      <TPS3808G01DBVR
        name="U6"
        pcbX={0}
        pcbY={0}
        schX={36}
        schY={-20}
        connections={{
          VDD: "net.V5VIN",
          GND: "net.GND",
          MR_N: "net.EN_1V5",
          RESET_N: "net.EN_0V9",
        }}
      />
      <Yageo24kOhm0603
        name="R13"
        pcbX={4.2}
        pcbY={2.7}
        schX={31}
        schY={-18}
        connections={{ pin1: "net.V1V5_DRAM", pin2: "U6.SENSE" }}
      />
      <Yageo10kOhm0402
        name="R14"
        pcbX={4.2}
        pcbY={5.5}
        pcbRotation={90}
        schX={31}
        schY={-22}
        connections={{ pin1: "U6.SENSE", pin2: "net.GND" }}
      />
      <UniRoyal100kOhm0402
        name="R15"
        pcbX={-4}
        pcbY={-1}
        schX={41}
        schY={-18}
        connections={{ pin1: "U6.RESET_N", pin2: "net.V5VIN" }}
      />
      <Samsung100nF0402
        name="C37"
        pcbX={4}
        pcbY={-1.5}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={41}
        schY={-22}
        connections={{ pin1: "U6.VDD", pin2: "net.GND" }}
      />
    </fanout>
    <fanout
      name="SUP09"
      autorouter="auto"
      padding="1.2mm"
      pcbX={7}
      pcbY={-20.5}
    >
      <TPS3808G01DBVR
        name="U7"
        pcbX={0}
        pcbY={0}
        schX={54}
        schY={-20}
        connections={{
          VDD: "net.V5VIN",
          GND: "net.GND",
          MR_N: "net.EN_0V9",
          RESET_N: "net.SOC_RESET_N",
        }}
      />
      <Yageo10k5Ohm0603
        name="R18"
        pcbX={-4.2}
        pcbY={2.7}
        schX={49}
        schY={-18}
        connections={{ pin1: "net.V0V9_CORE", pin2: "U7.SENSE" }}
      />
      <Yageo10kOhm0402
        name="R19"
        pcbX={-2}
        pcbY={5.5}
        pcbRotation={90}
        schX={49}
        schY={-22}
        connections={{ pin1: "U7.SENSE", pin2: "net.GND" }}
      />
      <UniRoyal100kOhm0402
        name="R20"
        pcbX={4}
        pcbY={-1}
        schX={59}
        schY={-18}
        connections={{ pin1: "U7.RESET_N", pin2: "net.V1V8_FIRST" }}
      />
      <Samsung100nF0402
        name="C40"
        pcbX={-4}
        pcbY={-1.5}
        pcbRotation={180}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={59}
        schY={-22}
        connections={{ pin1: "U7.VDD", pin2: "net.GND" }}
      />
      <UniRoyal100kOhm0402
        name="R21"
        pcbX={0}
        pcbY={4}
        pcbRotation={90}
        schX={54}
        schY={-24}
        connections={{ pin1: "U7.CT" }}
      />
      <trace from="R21.pin2" to="U7.VDD" />
    </fanout>
    <fanout
      name="MICROSD"
      autorouter="auto"
      padding="1.2mm"
      pcbX={-25}
      pcbY={24}
    >
      <HroMicroSd
        name="J1"
        pcbX={0}
        pcbY={0}
        pcbRotation={180}
        schX={72}
        schY={0}
        connections={{
          DAT2: "net.SD_DAT2",
          DAT3: "net.SD_DAT3",
          CMD: "net.SD_CMD",
          VDD: "net.V3V3",
          CLK: "net.SD_CLK",
          VSS: "net.GND",
          DAT0: "net.SD_DAT0",
          DAT1: "net.SD_DAT1",
          CD: "net.SD_CARD_DETECT",
          SHELL10: "net.GND",
          SHELL11: "net.GND",
          SHELL12: "net.GND",
          SHELL13: "net.GND",
        }}
      />
      <Murata10uF0805
        name="C41"
        pcbX={12}
        pcbY={-2}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={80}
        schY={2}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C42"
        pcbX={12}
        pcbY={-5}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        schX={80}
        schY={-2}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <A_0402WGF4702TCE
        name="R23"
        pcbX={-11.5}
        pcbY={-5}
        schX={68}
        schY={8}
        connections={{ pin1: "net.SD_DAT2", pin2: "net.V3V3" }}
      />
      <A_0402WGF4702TCE
        name="R24"
        pcbX={-11.5}
        pcbY={-2}
        schX={68}
        schY={4}
        connections={{ pin1: "net.SD_DAT3", pin2: "net.V3V3" }}
      />
      <A_0402WGF4702TCE
        name="R25"
        pcbX={-11.5}
        pcbY={1}
        schX={68}
        schY={0}
        connections={{ pin1: "net.SD_CMD", pin2: "net.V3V3" }}
      />
      <A_0402WGF4702TCE
        name="R26"
        pcbX={-11.5}
        pcbY={4}
        schX={68}
        schY={-4}
        connections={{ pin1: "net.SD_DAT0", pin2: "net.V3V3" }}
      />
      <A_0402WGF4702TCE
        name="R27"
        pcbX={-11.5}
        pcbY={7}
        pcbRotation={180}
        schX={68}
        schY={-8}
        connections={{ pin1: "net.SD_DAT1", pin2: "net.V3V3" }}
      />
      <A_0402WGF4702TCE
        name="R28"
        pcbX={-14.5}
        pcbY={7}
        schX={68}
        schY={-12}
        connections={{ pin1: "net.SD_CARD_DETECT" }}
      />
      <trace from="R28.pin2" to="R27.pin2" />
    </fanout>
    <fanout name="UART" autorouter="auto" padding="1.2mm" pcbX={55} pcbY={0}>
      <A_2_54_1_3
        name="J2"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        schX={92}
        schY={0}
        connections={{
          pin1: "net.GND",
          pin2: "net.UART3_TX",
          pin3: "net.UART3_RX",
        }}
      />
    </fanout>
    <fanout name="USB" autorouter="auto" padding="1.2mm" pcbX={-27} pcbY={-29}>
      <HroUsbC
        name="J3"
        pcbX={0}
        pcbY={0}
        schX={104}
        schY={0}
        pinAttributes={{
          A8: { doNotConnect: true },
          B8: { doNotConnect: true },
          A4B9: { providesPower: true, providesVoltage: "5V" },
          B4A9: { providesPower: true, providesVoltage: "5V" },
        }}
        connections={{
          A1B12: "net.GND",
          A5: "R29.pin1",
          B5: "R30.pin1",
        }}
      />
      <A_0402WGF5101TCE name="R29" pcbX={7} pcbY={-4} schX={112} schY={3} />
      <A_0402WGF5101TCE name="R30" pcbX={10} pcbY={-4} schX={112} schY={-3} />
      <USBLC6_2SC6
        name="U8"
        pcbX={8}
        pcbY={8}
        pcbRotation={90}
        schX={120}
        schY={0}
        connections={{
          IO1_A: "net.USB0_DP",
          IO1_B: "J3.A6",
          IO2_A: "net.USB0_DM",
          IO2_B: "J3.A7",
          GND: "net.GND",
          VBUS: "J3.A4B9",
        }}
      />
      <SMD1812P110TF
        name="F1"
        pcbX={14}
        pcbY={0}
        schX={128}
        schY={5}
        connections={{ IN: "J3.A4B9", OUT: "net.V5VIN" }}
      />
      <SMAJ5_0A
        name="D1"
        pcbX={21}
        pcbY={0}
        schX={128}
        schY={0}
        connections={{ K: "J3.A4B9", A: "net.GND" }}
      />
      <Murata10uF0805
        name="C43"
        pcbX={20}
        pcbY={-4}
        schX={136}
        schY={4}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        connections={{ pin1: "net.V5VIN", pin2: "net.GND" }}
      />
      <Samsung100nF0402
        name="C44"
        pcbX={14}
        pcbY={-4}
        schX={136}
        schY={-2}
        maxDecouplingTraceLength={Number.MAX_SAFE_INTEGER}
        connections={{ pin1: "J3.A4B9", pin2: "net.GND" }}
      />
      <trace from="J3.A1B12" to="J3.B1A12" />
      <trace from="J3.A1B12" to="J3.SHELL1" />
      <trace from="J3.SHELL1" to="J3.SHELL2" />
      <trace from="J3.SHELL2" to="J3.SHELL3" />
      <trace from="J3.SHELL3" to="J3.SHELL4" />
      <trace from="R29.pin2" to="J3.A1B12" />
      <trace from="R30.pin2" to="J3.B1A12" />
      <trace from="J3.A4B9" to="J3.B4A9" thickness="0.4mm" />
      <trace from="J3.A6" to="J3.B6" />
      <trace from="J3.A7" to="J3.B7" />
    </fanout>
  </board>
)
