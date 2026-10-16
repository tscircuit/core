import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CC1", "A5"],
  pin2: ["GND1", "A1"],
  pin3: ["VBUS1", "A4"],
  pin4: ["Dp1", "A6"],
  pin5: ["Dn1", "A7"],
  pin6: ["SBU1", "A8"],
  pin7: ["VBUS2", "A9"],
  pin8: ["GND2", "A12"],
  pin9: ["GND3", "B12"],
  pin10: ["VBUS3", "B9"],
  pin11: ["SBU2", "B8"],
  pin12: ["Dn2", "B7"],
  pin13: ["Dp2", "B6"],
  pin14: ["CC2", "B5"],
  pin15: ["VBUS4", "B4"],
  pin16: ["GND4", "B1"],
  pin17: ["S1"],
} as const

export const USB4085_GF_A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      standard="usb_c"
      pinAttributes={{
        pin2: { requiresGround: true },
        pin8: { requiresGround: true },
        pin9: { requiresGround: true },
        pin16: { requiresGround: true },
        pin17: { requiresGround: true },
        pin3: { isPassive: true },
        pin7: { isPassive: true },
        pin10: { isPassive: true },
        pin15: { isPassive: true },
      }}
      pinLabels={pinLabels}
      manufacturerPartNumber="USB4085-GF-A"
      {...props}
    />
  )
}
