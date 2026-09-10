import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_CS"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["GND"],
  pin5: ["pin5"],
  pin6: ["CLK"],
  pin7: ["pin7"],
  pin8: ["VCC"],
  pin9: ["EP"]
} as const

const pinAttributes = {
  pin4: {requiresGround: true},
  pin8: {requiresPower: true}
} as const

const footprinterPinLabels = {
  ...pinLabels,
  "pin9": [...pinLabels["pin9"], "thermalpad"],
} as const

export const W25N01GVZEIG = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C88868"
  ]
}}
      manufacturerPartNumber="W25N01GVZEIG"
      footprint="dfn8_thermalpad3.4mmx4.3mm_pillpads_w9.19mm_pw0.58mm_pl1.12mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C88868.obj?uuid=0408e8ef701a4f5fad0acb69fbbdc5af",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C88868.step?uuid=0408e8ef701a4f5fad0acb69fbbdc5af",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}