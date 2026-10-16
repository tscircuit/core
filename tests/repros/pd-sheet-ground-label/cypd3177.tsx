import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VBUS_MIN"],
  pin2: ["VBUS_MAX"],
  pin3: ["VBUS_FET_EN"],
  pin4: ["SAFE_PWR_EN"],
  pin5: ["ISNK_COARSE"],
  pin6: ["ISNK_FINE"],
  pin7: ["HPI_INT"],
  pin8: ["GPIO_1"],
  pin9: ["FAULT"],
  pin10: ["FLIP"],
  pin11: ["VDC_OUT"],
  pin12: ["HPI_SDA"],
  pin13: ["HPI_SCL"],
  pin14: ["CC2"],
  pin15: ["CC1"],
  pin16: ["D_NEG"],
  pin17: ["D_POS"],
  pin18: ["VBUS_IN"],
  pin19: ["GND1"],
  pin20: ["DNU1"],
  pin21: ["DNU2"],
  pin22: ["GND2"],
  pin23: ["VDDD"],
  pin24: ["VCCD"],
  pin25: ["EP"],
} as const

const pinAttributes = {
  pin18: { requiresPower: true },
  pin19: { requiresGround: true },
  pin22: { requiresGround: true },
  pin25: { requiresGround: true },
} as const

export const CYPD3177_24LQXQT = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      manufacturerPartNumber="CYPD3177-24LQXQT"
      {...props}
    />
  )
}
