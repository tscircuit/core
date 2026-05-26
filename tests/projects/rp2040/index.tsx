import { CrystalCircuit, CRYSTAL_SECTION } from "./CRYSTAL.circuit"
import { DebugCircuit, DEBUG_SECTION } from "./DEBUG.circuit"
import { PowerCircuit, POWER_SECTION } from "./POWER.circuit"
import { RP2040Circuit, RP2040_SECTION } from "./RP2040.circuit"
import { W25Q128JVSCircuit, W25Q128JVS_SECTION } from "./W25Q128JVS.circuit"

export default () => (
  <board routingDisabled>
    <net name="V3_3" isPowerNet />
    <net name="V1" isPowerNet />
    <net name="GND" isGroundNet />
    <net name="XIN" />
    <net name="XOUT" />
    <net name="XOUT_XTAL" />
    <net name="RUN" />
    <net name="SWD" />
    <net name="SWCLK" />
    <net name="QSPI_CS" />
    <net name="QSPI_SCLK" />
    <net name="QSPI_SD0" />
    <net name="QSPI_SD1" />
    <net name="QSPI_SD2" />
    <net name="QSPI_SD3" />
    <net name="ACT_LED" />
    <net name="AUX_LED" />
    <net name="USB_DP" />
    <net name="USB_DM" />
    <net name="CAM_LED" />
    <net name="AUX_OUT" />
    <net name="QIN_1" />
    <net name="QIN_2" />
    <net name="BTOUCH_CONTROL" />
    <net name="BTOUCH_STATUS" />
    <net name="QWIIC_SDA" />
    <net name="QWIIC_SCL" />
    <net name="TMC_UART" />
    <net name="QN0_DIR" />
    <net name="QN0_STEP" />
    <net name="QN0_DIAG" />
    <net name="QN0_EN" />
    <net name="QN1_DIR" />
    <net name="QN1_STEP" />
    <net name="QN1_DIAG" />
    <net name="QN1_EN" />
    <net name="QN2_DIR" />
    <net name="QN2_STEP" />
    <net name="QN2_DIAG" />
    <net name="QN2_EN" />

    <schematicsection name={RP2040_SECTION} displayName="Microcontroller" />
    <schematicsection
      name={POWER_SECTION}
      displayName="Power supply bypassing"
    />
    <schematicsection
      name={DEBUG_SECTION}
      displayName="Debug, boot select, and LED"
    />
    <schematicsection name={CRYSTAL_SECTION} displayName="12 MHz crystal" />
    <schematicsection name={W25Q128JVS_SECTION} displayName="QSPI flash" />

    <RP2040Circuit />
    <PowerCircuit />
    <DebugCircuit />
    <CrystalCircuit />
    <W25Q128JVSCircuit />

    <trace from="U3.pin1" to="net.V3_3" />
    <trace from="U3.pin10" to="net.V3_3" />
    <trace from="U3.pin33" to="net.V3_3" />
    <trace from="U3.pin42" to="net.V3_3" />
    <trace from="U3.pin43" to="net.V3_3" />
    <trace from="U3.pin44" to="net.V3_3" />
    <trace from="U3.pin48" to="net.V3_3" />
    <trace from="U3.pin49" to="net.V3_3" />
    <trace from="U3.pin45" to="net.V1" />
    <trace from="U3.pin50" to="net.V1" />
    <trace from="U3.pin19" to="net.GND" />
    <trace from="U3.pin57" to="net.GND" />

    <trace from="U3.pin20" to="net.XIN" />
    <trace from="U3.pin21" to="net.XOUT" />
    <trace from="U3.pin24" to="net.SWCLK" />
    <trace from="U3.pin25" to="net.SWD" />
    <trace from="U3.pin26" to="net.RUN" />
    <trace from="U3.pin2" to="net.CAM_LED" />
    <trace from="U3.pin3" to="net.AUX_OUT" />
    <trace from="U3.pin4" to="net.QIN_1" />
    <trace from="U3.pin5" to="net.QIN_2" />
    <trace from="U3.pin6" to="net.BTOUCH_CONTROL" />
    <trace from="U3.pin7" to="net.BTOUCH_STATUS" />
    <trace from="U3.pin13" to="net.QWIIC_SDA" />
    <trace from="U3.pin14" to="net.QWIIC_SCL" />
    <trace from="U3.pin16" to="net.AUX_LED" />
    <trace from="U3.pin18" to="net.ACT_LED" />
    <trace from="R6.pin2" to="net.USB_DP" />
    <trace from="R7.pin2" to="net.USB_DM" />
    <trace from="R8.pin2" to="net.TMC_UART" />
    <trace from="U3.pin29" to="net.QN0_DIR" />
    <trace from="U3.pin30" to="net.QN0_STEP" />
    <trace from="U3.pin31" to="net.QN0_DIAG" />
    <trace from="U3.pin32" to="net.QN0_EN" />
    <trace from="U3.pin34" to="net.QN1_DIR" />
    <trace from="U3.pin35" to="net.QN1_STEP" />
    <trace from="U3.pin36" to="net.QN1_DIAG" />
    <trace from="U3.pin37" to="net.QN1_EN" />
    <trace from="U3.pin38" to="net.QN2_DIR" />
    <trace from="U3.pin39" to="net.QN2_STEP" />
    <trace from="U3.pin40" to="net.QN2_DIAG" />
    <trace from="U3.pin41" to="net.QN2_EN" />

    <trace from="U3.pin56" to="net.QSPI_CS" />
    <trace from="U3.pin52" to="net.QSPI_SCLK" />
    <trace from="U3.pin53" to="net.QSPI_SD0" />
    <trace from="U3.pin55" to="net.QSPI_SD1" />
    <trace from="U3.pin54" to="net.QSPI_SD2" />
    <trace from="U3.pin51" to="net.QSPI_SD3" />
    <trace from="U4.pin1" to="net.QSPI_CS" />
    <trace from="U4.pin6" to="net.QSPI_SCLK" />
    <trace from="U4.pin5" to="net.QSPI_SD0" />
    <trace from="U4.pin2" to="net.QSPI_SD1" />
    <trace from="U4.pin3" to="net.QSPI_SD2" />
    <trace from="U4.pin7" to="net.QSPI_SD3" />
    <trace from="U4.pin8" to="net.V3_3" />
    <trace from="U4.pin4" to="net.GND" />
    <trace from="U4.GND" to="net.GND" />

    <trace from="TP5.pin1" to="net.GND" />
    <trace from="TP6.pin1" to="net.V3_3" />
    <trace from="TP7.pin1" to="net.RUN" />
    <trace from="TP8.pin1" to="net.SWD" />
    <trace from="TP9.pin1" to="net.SWCLK" />
    <trace from="SW2.pin1" to="net.RUN" />
    <trace from="SW1.pin1" to="net.QSPI_CS" />
    <trace from="ACT_LED.pin1" to="net.ACT_LED" />
    <trace from="AUX_LED.pin1" to="net.AUX_LED" />
  </board>
)
