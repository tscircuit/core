import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["SW"],
  pin2: ["GND"],
  pin3: ["FB"],
  pin4: ["EN"],
  pin5: ["IN"],
  pin6: ["NC"],
} as const

export const MT3608 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C84817"],
      }}
      manufacturerPartNumber="MT3608"
      footprint="dfn6_p0.95mm_w3.37mm_pw0.53mm_pl1.07mm_pin1location(leftside,bottom)"
      {...props}
    />
  )
}
