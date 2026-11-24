import React from "react"
import { ddrAddress } from "./stm32mp157"

// DDR bus-lanes performs native signal fanout before routing the byte groups.
// Route critical signals before committing vias for unrelated power/control nets.
// Keep whole nets together: later phases must route around earlier copper.
export const routingPhase = {
  ddrByte0: 0,
  ddrByte1: 0,
  ddr: 2,
  usb: 3,
  usbPower: 4,
  computePower: 5,
  ground: 6,
  logicPower: 7,
  inputPower: 8,
  motor1: 9,
  motor2: 10,
  motor3: 11,
  motor4: 12,
} as const

const buckSignals = ["BOOT", "EN", "RT", "FB", "COMP", "SW", "RC"]
const motorSignals = [
  "IMON",
  "VMON",
  "BUCK_EN",
  "FAULT_N",
  "SDA",
  "SCL",
  "VIN_IC",
  "MODE",
  "RT",
  "SLOPE",
  "SS",
  "COMP",
  "FB",
  "REG",
  "CSG",
  "CS",
  "PGOOD",
  "SW2",
  "HG2",
  "BOOT2",
  "LG2",
  "VCC",
  "LG1",
  "BOOT1",
  "HG1",
  "SW1",
  "CS_RAW",
  "COMP_RC",
  "CC1",
  "CC2",
  "SEL12",
  "SEL9",
  "SEL15",
  "SEL20",
  "VBUS",
  "DISCH",
  "PD_EN_N",
  "PD1V2",
  "PD2V7",
  "PORT_EN",
  "OVLO",
  "DVDT",
  "ITIMER",
  "PD_ATTACHED",
]

// Preserve the original net attributes; phase assignment changes ordering only.
const powerNets = new Set([
  "VIN20",
  "MPU5V",
  "USB5V",
  "SYS3V3",
  "MPU3V3",
  "MPU_CORE",
  "DDR1V35",
  "MPU_AUX3V3",
  "SD3V3",
  "MPU_VDDA",
  "MPU_USB3V3",
  "DDR_VREF",
  "DDR_VTT",
])

export const routingPhases = [
  {
    index: routingPhase.ddrByte0,
    name: "DDR_DATA_SIGNALS",
    // Plan both bytes' escapes together before either byte becomes fixed copper.
    // DdrRouting retains a separate length-matching bus for each byte.
    nets: [
      ...Array.from({ length: 8 }, (_, bit) => `DDR_DQ${bit}`),
      "DDR_DQM0",
    ],
  },
  {
    index: routingPhase.ddr,
    name: "DDR_SIGNALS",
    nets: [
      "DDR_CLKP",
      "DDR_CLKN",
      "DDR_RESETN",
      ...ddrAddress.flatMap((n) => [n, `${n}_CPU`]),
    ],
  },
  {
    index: routingPhase.usb,
    name: "USB_DATA",
    nets: ["PC", "HOST", "CAM", "M1", "M2", "M3", "M4"].flatMap((n) => [
      `${n}_USB_DP`,
      `${n}_USB_DM`,
    ]),
  },
  {
    index: routingPhase.usbPower,
    name: "USB_POWER",
    // Reserve the USB5V feed and port VBUS before routing the nearby AUX supply.
    nets: [
      "USB5V",
      ...buckSignals.map((n) => `USB5V_${n}`),
      ...[1, 2, 3, 4, 5].map((n) => `USB${n}_VBUS`),
    ],
  },
  {
    index: routingPhase.computePower,
    name: "COMPUTE_POWER",
    nets: [
      "MPU5V",
      ...buckSignals.map((n) => `MPU5V_${n}`),
      "MPU3V3",
      "MPU_CORE",
      "DDR1V35",
      "MPU_AUX3V3",
      "SD3V3",
      "MPU_VDDA",
      "MPU_USB3V3",
      "DDR_VREF",
      "DDR_VTT",
      "MPU_REG1V8",
      "MPU_REG1V1",
      "MPU_DSI1V2",
      "PMIC_SW1",
      "PMIC_SW2",
      "PMIC_SW3",
      "PMIC_SW4",
      "PMIC_LDO2",
      "PMIC_LDO5",
      "PMIC_INTLDO",
    ],
  },
  { index: routingPhase.ground, name: "GROUND_CONNECTIONS", nets: ["GND"] },
  { index: routingPhase.logicPower, name: "LOGIC_POWER", nets: ["SYS3V3"] },
  {
    index: routingPhase.inputPower,
    name: "PD_INPUT_POWER",
    nets: [
      "VIN20",
      "PD_RAW",
      "PD1V2",
      "PD2V7",
      "PD_SENSE",
      "INPUT_CC1",
      "INPUT_CC2",
      "INPUT_DISCH",
      "INPUT_EN_N",
      "INPUT_UVLO",
      "INPUT_OVLO",
      "INPUT_DVDT",
      "INPUT_ITIMER",
    ],
  },
  ...[
    routingPhase.motor1,
    routingPhase.motor2,
    routingPhase.motor3,
    routingPhase.motor4,
  ].map((index, i) => ({
    index,
    name: `M${i + 1}_POWER_AND_CONTROL`,
    nets: motorSignals.map((n) => `M${i + 1}_${n}`),
  })),
]

export function RoutingPhases({ busesOnly = false }: { busesOnly?: boolean }) {
  return (
    <>
      {routingPhases.map(({ index, name, nets }) => {
        const isByte = (
          [routingPhase.ddrByte0, routingPhase.ddrByte1] as number[]
        ).includes(index)
        const active = !busesOnly || isByte
        return (
          <React.Fragment key={name}>
            {active && (
              <autoroutingphase
                name={name}
                phaseIndex={index}
                autorouter={isByte ? "bus_lanes" : undefined}
              />
            )}
            {nets.map((net) => (
              <React.Fragment key={net}>
                <net
                  name={net}
                  routingPhaseIndex={active ? index : undefined}
                  isGroundNet={net === "GND" ? true : undefined}
                  isPowerNet={powerNets.has(net) ? true : undefined}
                  nominalTraceWidth={net === "VIN20" ? 3 : undefined}
                />
              </React.Fragment>
            ))}
          </React.Fragment>
        )
      })}
      {!busesOnly && <autoroutingphase name="CONTROL_AND_REMAINING" />}
    </>
  )
}
