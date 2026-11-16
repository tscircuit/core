import type { ChipProps } from "@tscircuit/props"

const pt4115PinLabels = {
  pin1: ["SW"],
  pin2: ["GND"],
  pin3: ["DIM"],
  pin4: ["CSN"],
  pin5: ["VIN"],
} as const

export const PT4115 = (props: ChipProps<typeof pt4115PinLabels>) => (
  <chip
    pinLabels={pt4115PinLabels}
    manufacturerPartNumber="PT4115B89E"
    supplierPartNumbers={{ jlcpcb: ["C84512"] }}
    footprint="sot89_5"
    {...props}
  />
)
