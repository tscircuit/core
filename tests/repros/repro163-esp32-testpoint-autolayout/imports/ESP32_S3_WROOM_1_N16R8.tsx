import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND1"],
  pin2: ["3V3"],
  pin3: ["EN"],
  pin4: ["IO4"],
  pin5: ["IO5"],
  pin6: ["IO6"],
  pin7: ["IO7"],
  pin8: ["IO15"],
  pin9: ["IO16"],
  pin10: ["IO17"],
  pin11: ["IO18"],
  pin12: ["IO8"],
  pin13: ["IO19"],
  pin14: ["IO20"],
  pin15: ["IO3"],
  pin16: ["IO46"],
  pin17: ["IO9"],
  pin18: ["IO10"],
  pin19: ["IO11"],
  pin20: ["IO12"],
  pin21: ["IO13"],
  pin22: ["IO14"],
  pin23: ["IO21"],
  pin24: ["IO47"],
  pin25: ["IO48"],
  pin26: ["IO45"],
  pin27: ["IO0"],
  pin28: ["IO35"],
  pin29: ["IO36"],
  pin30: ["IO37"],
  pin31: ["IO38"],
  pin32: ["IO39"],
  pin33: ["IO40"],
  pin34: ["IO41"],
  pin35: ["IO42"],
  pin36: ["RXD0"],
  pin37: ["TXD0"],
  pin38: ["IO2"],
  pin39: ["IO1"],
  pin40: ["GND2"],
  pin41: ["GND3"],
  pin42: ["pin41_alt1"],
  pin43: ["pin41_alt1"],
  pin44: ["pin41_alt1"],
  pin45: ["pin41_alt1"],
  pin46: ["pin41_alt1"],
  pin47: ["pin41_alt1"],
  pin48: ["pin41_alt1"],
  pin49: ["pin41_alt1"],
} as const

export const ESP32_S3_WROOM_1_N16R8 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    manufacturerPartNumber="ESP32_S3_WROOM_1_N16R8"
    {...props}
  />
)
