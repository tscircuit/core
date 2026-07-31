import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["BYP"],
  pin5: ["OUT"],
} as const

export const MIC5219_3_3YM5_TR = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    supplierPartNumbers={{ jlcpcb: ["C29613"] }}
    manufacturerPartNumber="MIC5219_3_3YM5_TR"
    footprint="dfn6_missing(5)_p0.9502mm_w3.5428mm_pw0.55mm"
    cadModel={{
      objUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C29613.obj?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
      stepUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C29613.step?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
      pcbRotationOffset: 0,
      modelOriginPosition: {
        x: 0,
        y: 0.000012700000070253736,
        z: -0.049083,
      },
    }}
    {...props}
  />
)
