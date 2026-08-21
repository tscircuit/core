import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["XTAL1"],
  pin2: ["GND1"],
  pin3: ["XTAL2"],
  pin4: ["GND2"],
} as const

const footprinterPinLabels = {
  pin1: ["GND1", "pin2"],
  pin2: ["XTAL2", "pin3"],
  pin3: ["GND2", "pin4"],
  pin4: ["XTAL1", "pin1"],
} as const

export const X201632MKB4SI = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C718072"],
      }}
      manufacturerPartNumber="X201632MKB4SI"
      footprint="dfn4_p1.0998mm_w2.3mm_pw0.8mm_pl0.9mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C718072.obj?uuid=51ae9b24ba7a408881f7752b57b66e45",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C718072.step?uuid=51ae9b24ba7a408881f7752b57b66e45",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999956566899, z: -0.01 },
      }}
      {...props}
    />
  )
}
