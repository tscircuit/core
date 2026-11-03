import { LTST_C190KGKT } from "../imports/LTST_C190KGKT"
import { LTST_C190KFKT } from "../imports/LTST_C190KFKT"
import { JstBattery } from "./jst-battery"
import { XFL4020_222MEC } from "../imports/XFL4020_222MEC"
import { BQ24074RGTR } from "../imports/BQ24074RGTR"
import { TPS63030DSKR } from "../imports/TPS63030DSKR"
import { TYPE_C_31_M_12 } from "../imports/TYPE_C_31_M_12"
import { R, C } from "./passives"

export function Power() {
  return (
    <>
      <schematicsheet
        name="charger"
        displayName={"U2 BQ24074, 4.2 V LiPo\n249 mA charge, 500 mA input"}
        sheetIndex={2}
        sheetWidth={420}
        sheetHeight={297}
      >
        <group
          name="charger_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <TYPE_C_31_M_12
            name="J1"
            pcbX={-14}
            pcbY={-38}
            pcbRotation={0}
            noConnect={["B8", "A8", "A6", "A7", "B6", "B7"]}
            connections={{
              GND1: "net.GND",
              GND2: "net.GND",
              EH1: "net.GND",
              EH2: "net.GND",
              EH3: "net.GND",
              EH4: "net.GND",
              VBUS1: "net.CHARGE_VBUS",
              VBUS2: "net.CHARGE_VBUS",
              CC1: "net.CHARGE_CC1",
              CC2: "net.CHARGE_CC2",
            }}
          />
          <R
            name="R10"
            resistance="5.1k"
            from="CHARGE_CC1"
            to="GND"
            pcbX={-21}
            pcbY={-26}
          />
          <R
            name="R11"
            pcbRotation={180}
            resistance="5.1k"
            from="CHARGE_CC2"
            to="GND"
            pcbX={-18}
            pcbY={-29}
          />
          <fuse
            schRotation={-90}
            name="F1"
            currentRating="0.75A"
            footprint="1206"
            manufacturerPartNumber="1206L075/16YR"
            pcbX={-14}
            pcbY={-30}
            connections={{ pin1: "net.CHARGE_VBUS", pin2: "net.CHARGE_5V" }}
          />
          <C
            name="C10"
            capacitance="10uF"
            from="CHARGE_5V"
            pcbX={-20}
            pcbY={-24}
            layer="bottom"
          />
          <C
            name="C11"
            capacitance="100nF"
            from="CHARGE_5V"
            pcbX={-20}
            pcbY={-21}
            layer="bottom"
          />
          <BQ24074RGTR
            name="U2"
            pcbX={-15}
            pcbY={-21}
            layer="bottom"
            connections={{
              IN: "net.CHARGE_5V",
              BAT1: "net.VBAT",
              BAT2: "net.VBAT",
              OUT1: "net.VSYS",
              OUT2: "net.VSYS",
              TS: "net.BAT_NTC",
              N_CE: "net.GND",
              EN1: "net.VSYS",
              EN2: "net.GND",
              VSS: "net.GND",
              EP: "net.GND",
              N_PGOOD: "net.PGOOD_N",
              N_CHG: "net.CHARGE_N",
              ILIM: "net.CHARGE_ILIM",
              ISET: "net.CHARGE_ISET",
              TMR: "net.CHARGE_TMR",
            }}
          />
          <group
            name="U2_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"LiPo charger\n4.2 V, 249 mA"}
            pcbRelative
          />
          <R
            name="R12"
            resistance="3.57k"
            from="CHARGE_ISET"
            to="GND"
            pcbX={-17}
            pcbY={-17}
            layer="bottom"
          />
          <R
            name="R13"
            pcbRotation={180}
            resistance="2.94k"
            from="CHARGE_ILIM"
            to="GND"
            pcbX={-14}
            pcbY={-17}
            layer="bottom"
          />
          <R
            name="R14"
            resistance="47k"
            from="CHARGE_TMR"
            to="GND"
            pcbX={-11}
            pcbY={-17}
            layer="bottom"
          />
          <C
            name="C12"
            capacitance="10uF"
            from="VBAT"
            pcbX={-23}
            pcbY={-19}
            layer="bottom"
          />
          <C
            name="C13"
            capacitance="22uF"
            from="VSYS"
            pcbX={-9}
            pcbY={-21}
            layer="bottom"
          />
          <JstBattery
            name="J3"
            pcbX={-20}
            pcbY={-12}
            layer="bottom"
            manufacturerPartNumber="B3B-PH-K-S(LF)(SN)"
            pinLabels={{ pin1: "BAT_POS", pin2: "NTC", pin3: "GND" }}
            connections={{
              pin1: "net.VBAT",
              pin2: "net.BAT_NTC",
              pin3: "net.GND",
            }}
          />
          <R
            name="R18"
            pcbRotation={180}
            resistance="2.2k"
            from="CHARGE_5V"
            to="CHARGE_LED_A"
            pcbX={-23}
            pcbY={-28}
          />
          <LTST_C190KFKT
            name="LED2"
            color="orange"
            pcbX={-23}
            pcbY={-31}
            connections={{ anode: "net.CHARGE_LED_A", cathode: "net.CHARGE_N" }}
          />
          <R
            name="R19"
            resistance="2.2k"
            from="CHARGE_5V"
            to="INPUT_LED_A"
            pcbX={-3}
            pcbY={-33}
          />
          <LTST_C190KGKT
            name="LED3"
            color="green"
            pcbX={-3}
            pcbY={-36}
            connections={{ anode: "net.INPUT_LED_A", cathode: "net.PGOOD_N" }}
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="regulator"
        displayName={"U3 TPS63030\n3.3 V buck-boost"}
        sheetIndex={3}
      >
        <group
          name="regulator_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <C
            name="C14"
            capacitance="10uF"
            from="VSYS"
            pcbX={-22}
            pcbY={-4}
            layer="bottom"
          />
          <C
            name="C15"
            capacitance="100nF"
            from="VSYS"
            pcbX={-21}
            pcbY={0}
            layer="bottom"
          />
          <TPS63030DSKR
            name="U3"
            pcbX={-15}
            pcbY={-8}
            layer="bottom"
            connections={{
              VIN: "net.VSYS",
              VINA: "net.VSYS",
              EN: "net.VSYS",
              pin7: "net.GND",
              GND: "net.GND",
              PGND: "net.GND",
              EP: "net.GND",
              L1: "net.BUCK_L1",
              L2: "net.BUCK_L2",
              VOUT: "net.V3V3",
              FB: "net.BUCK_FB",
            }}
          />
          <group
            name="U3_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"Buck-boost regulator\n3.3 V"}
            pcbRelative
          />
          <XFL4020_222MEC
            name="L1"
            pcbX={-15}
            pcbY={-3}
            layer="bottom"
            connections={{ pin1: "net.BUCK_L1", pin2: "net.BUCK_L2" }}
          />

          <C
            name="C16"
            capacitance="22uF"
            from="V3V3"
            pcbX={-9}
            pcbY={-8}
            layer="bottom"
          />
          <C
            name="C17"
            capacitance="22uF"
            from="V3V3"
            pcbX={-9}
            pcbY={-4}
            layer="bottom"
          />
          <R
            name="R15"
            resistance="560k"
            from="V3V3"
            to="BUCK_FB"
            pcbX={-9}
            pcbY={-1}
            layer="bottom"
          />
          <R
            name="R16"
            resistance="100k"
            from="BUCK_FB"
            to="GND"
            pcbX={-5}
            pcbY={-2}
            layer="bottom"
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="power_status"
        displayName={"3.3 V power indication"}
        sheetIndex={4}
      >
        <group
          name="power_status_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <R
            name="R17"
            pcbRotation={180}
            resistance="2.2k"
            from="V3V3"
            to="POWER_LED_A"
            pcbX={-25}
            pcbY={19}
          />
          <LTST_C190KGKT
            name="LED1"
            schRotation={-90}
            color="green"
            pcbX={-25}
            pcbY={22}
            connections={{ anode: "net.POWER_LED_A", cathode: "net.GND" }}
          />
        </group>
      </schematicsheet>
    </>
  )
}
