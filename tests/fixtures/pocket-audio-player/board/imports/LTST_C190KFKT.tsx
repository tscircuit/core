import type { LedProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode", "neg"],
  pin2: ["anode", "pos"],
} as const

export const LTST_C190KFKT = (props: LedProps) => {
  const { name = "LED1", ...restProps } = props

  return (
    <led
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C157740"],
      }}
      manufacturerPartNumber="LTST-C190KFKT"
      footprint="smdpads2_p1.498mm_pw0.8mm_ph0.8mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C157740.obj?uuid=3c2caa1a3e7d4a5a87f46b87d898ef41",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C157740.step?uuid=3c2caa1a3e7d4a5a87f46b87d898ef41",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.000012700000070253736,
          y: 0.000012699999956566899,
          z: -0.01,
        },
      }}
      {...restProps}
    />
  )
}
