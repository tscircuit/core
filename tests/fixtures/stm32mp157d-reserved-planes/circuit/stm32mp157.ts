import pinData from "../library/stm32mp157dab-import-map.json"

// Ball identities: STMicroelectronics/STM32_open_pin_data, STM32MP157DABx.xml.
// The imported JLC footprint uses numeric pin identifiers; never substitute
// the DAC1 discovery-board ball numbers for this DAB1 package.
export const mpuPins = pinData as Record<
  string,
  { ball: string; name: string; type: string; signals: string[] }
>
export const pinFor = (signal: string) => {
  const entries = Object.entries(mpuPins).filter(([, p]) => p.name === signal)
  if (entries.length !== 1)
    throw Error(`Expected one STM32 ball for ${signal}, got ${entries.length}`)
  return `pin${entries[0][0]}`
}
export const ddrAddress = [
  ...Array.from({ length: 15 }, (_, i) => `DDR_A${i}`),
  ...Array.from({ length: 3 }, (_, i) => `DDR_BA${i}`),
  "DDR_RASN",
  "DDR_CASN",
  "DDR_CSN",
  "DDR_CKE",
  "DDR_WEN",
  "DDR_ODT",
]
const power: Record<string, string> = {
  VDD: "MPU3V3",
  VDDCORE: "MPU_CORE",
  VDDQ_DDR: "DDR1V35",
  VBAT: "MPU3V3",
  VDD_DSI: "MPU3V3",
  VDD_PLL: "MPU3V3",
  VDD_PLL2: "MPU3V3",
  VDD_ANA: "MPU3V3",
  VDDA: "MPU_VDDA",
  "VREF+": "MPU_VDDA",
  VDDA1V8_REG: "MPU_REG1V8",
  VDDA1V8_DSI: "MPU_REG1V8",
  VDDA1V1_REG: "MPU_REG1V1",
  VDD1V2_DSI_REG: "MPU_DSI1V2",
  VDD1V2_DSI_PHY: "MPU_DSI1V2",
  VDD3V3_USBHS: "MPU_USB3V3",
  VDD3V3_USBFS: "MPU_USB3V3",
}
const io: Record<string, string> = {
  USB_DP1: "HOST_USB_DP",
  USB_DM1: "HOST_USB_DM",
  USB_DP2: "PC_USB_DP",
  USB_DM2: "PC_USB_DM",
  USB_RREF: "MPU_USB_RREF",
  OTG_VBUS: "PC_VBUS_SENSE",
  BYPASS_REG1V8: "GND",
  "PH0-OSC_IN": "MPU_HSE_IN",
  "PH1-OSC_OUT": "MPU_HSE_OUT",
  "PC14-OSC32_IN": "GND",
  NRST: "MPU_RESET_N",
  NRST_CORE: "MPU_RESET_CORE_N",
  PDR_ON: "MPU3V3",
  PDR_ON_CORE: "MPU3V3",
  PWR_ON: "MPU_PWR_ON",
  BOOT0: "MPU_BOOT0",
  BOOT1: "GND",
  BOOT2: "MPU_BOOT2",
  PA13: "MPU_HOST_EN",
  PD12: "MPU_I2C4_SCL",
  PD13: "MPU_I2C4_SDA",
  PA0: "PMIC_IRQ_N",
  PC13: "PMIC_WAKEUP",
  PB2: "MPU_CONSOLE_RX",
  PG11: "MPU_CONSOLE_TX",
  PD8: "MPU_UART_TX",
  PD9: "MPU_UART_RX",
  "JTMS-SWDIO": "MPU_SWDIO",
  "JTCK-SWCLK": "MPU_SWCLK",
  PC8: "SD_D0",
  PC9: "SD_D1",
  PC10: "SD_D2",
  PC11: "SD_D3",
  PC12: "SD_CLK_RAW",
  PD2: "SD_CMD",
  DDR_VREF: "DDR_VREF",
  DDR_ZQ: "MPU_DDR_ZQ",
}
export const mpuConnections: Record<string, string> = {}
for (const [id, p] of Object.entries(mpuPins)) {
  let n = power[p.name] ?? io[p.name]
  if (p.name.startsWith("VSS") || p.name === "VREF-") n = "GND"
  if (ddrAddress.includes(p.name)) n = `${p.name}_CPU`
  if (/^DDR_(DQ\d+|DQM[01]|DQS[01][PN]|CLK[PN]|RESETN)$/.test(p.name))
    n = p.name
  if (n) mpuConnections[id] = n
}
export const mpuLabels = Object.fromEntries(
  Object.entries(mpuPins).map(([id, p]) => [
    id,
    `${p.ball}_${p.name.replace(/[^A-Za-z0-9_]/g, "_")}`,
  ]),
)
export const mpuNC = Object.keys(mpuPins).filter((p) => !mpuConnections[p])

// Nanya 96-ball package, datasheet package pinout. Numeric pin IDs are those
// in the unmodified C428584 import. Correct semantic aliases here, not copper.
export const dramLabels: Record<string, string> = {
  1: "VDDQ",
  2: "VSSQ",
  3: "VDDQ",
  4: "VSSQ",
  5: "VSS",
  6: "VDDQ",
  7: "VSSQ",
  8: "VREFDQ",
  9: "NC",
  10: "ODT",
  11: "NC",
  12: "VSS",
  13: "VDD",
  14: "VSS",
  15: "VDD",
  16: "VSS",
  17: "DQ13",
  18: "VDD",
  19: "DQ11",
  20: "VDDQ",
  21: "VSSQ",
  22: "DQ2",
  23: "DQ6",
  24: "VDDQ",
  25: "VSS",
  26: "VDD",
  27: "CSN",
  28: "BA0",
  29: "A3",
  30: "A5",
  31: "A7",
  32: "RESETN",
  33: "DQ15",
  34: "VSS",
  35: "DQ9",
  36: "DQM1",
  37: "DQ0",
  38: "DQS0P",
  39: "DQS0N",
  40: "DQ4",
  41: "RASN",
  42: "CASN",
  43: "WEN",
  44: "BA2",
  45: "A0",
  46: "A2",
  47: "A9",
  48: "A13",
  49: "DQ12",
  50: "DQS1N",
  51: "DQS1P",
  52: "DQ8",
  53: "DQM0",
  54: "DQ1",
  55: "VDD",
  56: "DQ7",
  57: "CLKP",
  58: "CLKN",
  59: "A10",
  60: "NC",
  61: "A12",
  62: "A1",
  63: "A11",
  64: "A14",
  65: "VDDQ",
  66: "DQ14",
  67: "DQ10",
  68: "VSSQ",
  69: "VSSQ",
  70: "DQ3",
  71: "VSS",
  72: "DQ5",
  73: "VSS",
  74: "VDD",
  75: "ZQ",
  76: "VREFCA",
  77: "BA1",
  78: "A4",
  79: "A6",
  80: "A8",
  81: "VSS",
  82: "VSSQ",
  83: "VDDQ",
  84: "VDD",
  85: "VDDQ",
  86: "VSSQ",
  87: "VSSQ",
  88: "VDDQ",
  89: "NC",
  90: "CKE",
  91: "NC",
  92: "VSS",
  93: "VDD",
  94: "VSS",
  95: "VDD",
  96: "VSS",
}
// RAM DQ bit connected to each STM32 DQ bit. Only DQ bits within the same
// byte are permuted; DQM and DQS polarity/byte identity remain unchanged.
// This reduces crossing routes for the actual top-side placement. DDR3L stores
// and reads a bit on the same wire, so no firmware remapping is needed.
// ST confirmation: https://community.st.com/stm32-mpus-products-and-hardware-related-39/ddr3l-bit-swap-inside-bytes-how-to-configure-it-58988
export const dramDqForMpuDq = [
  3, 5, 6, 1, 2, 0, 4, 7, 14, 10, 12, 9, 11, 8, 15, 13,
] as const
if (
  new Set(dramDqForMpuDq).size !== 16 ||
  dramDqForMpuDq.some(
    (dramBit, mpuBit) => Math.floor(dramBit / 8) !== Math.floor(mpuBit / 8),
  )
) {
  throw new Error("DDR3L data-bit mapping must be bijective within each byte")
}
export const dramConnections = Object.fromEntries(
  Object.entries(dramLabels)
    .filter(([, name]) => name !== "NC")
    .map(([pin, name]) => {
      const bit = /^DQ(\d+)$/.exec(name)
      const net = bit
        ? `DDR_DQ${dramDqForMpuDq.findIndex((dramBit) => dramBit === Number(bit[1]))}`
        : name.startsWith("VDD")
          ? "DDR1V35"
          : name.startsWith("VSS")
            ? "GND"
            : name.startsWith("VREF")
              ? "DDR_VREF"
              : name === "ZQ"
                ? "DRAM_ZQ"
                : `DDR_${name}`
      return [pin, net]
    }),
)
export const dramPinFor = (signal: string) => {
  const pins = Object.entries(dramConnections).filter(
    ([, net]) => net === signal,
  )
  if (pins.length !== 1)
    throw new Error(`Expected one DRAM pin for ${signal}, got ${pins.length}`)
  return `pin${pins[0][0]}`
}
