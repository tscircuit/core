import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OSC1"],
  pin2: ["OSC2"],
} as const

export const ABS07_32_768KHZ_9_T = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C179635"],
      }}
      manufacturerPartNumber="ABS07_32_768KHZ_9_T"
      footprint="res_p2.5499mm_pw1.05mm_ph1.7mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C179635.obj?uuid=eac14d4facdb45dfa3b66d00e2a3c6e4",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C179635.step?uuid=eac14d4facdb45dfa3b66d00e2a3c6e4",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.000025400000026820635,
          y: -0.00013969999997698324,
          z: -0.01,
        },
      }}
      {...props}
    />
  )
}
