import type { LedProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["anode", "pos"],
  pin2: ["cathode", "neg"],
} as const

export const KT_0603R = (props: LedProps) => {
  const { name = "LED1", ...restProps } = props

  return (
    <led
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2286"],
      }}
      manufacturerPartNumber="KT-0603R"
      footprint="smdpads2_p1.5001mm_pw0.8mm_ph0.8mm_pin1location(rightside,top)"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2286.obj?uuid=0da0275bf7a84667bce8747a921fb9e3",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2286.step?uuid=0da0275bf7a84667bce8747a921fb9e3",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.000050799999826267594,
          y: -0.00005079999993995443,
          z: -0.01,
        },
      }}
      {...restProps}
    />
  )
}
