import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["NC9"],
  pin2: ["NC1"],
  pin3: ["NC2"],
  pin4: ["NC3"],
  pin5: ["NC4"],
  pin6: ["NC10"],
  pin7: ["AUX_CL"],
  pin8: ["VDDIO"],
  pin9: ["AD0"],
  pin10: ["REGOUT"],
  pin11: ["FSYNC"],
  pin12: ["INT1"],
  pin13: ["VDD"],
  pin14: ["NC5"],
  pin15: ["NC6"],
  pin16: ["NC7"],
  pin17: ["NC8"],
  pin18: ["GND"],
  pin19: ["RESV2"],
  pin20: ["RESV1"],
  pin21: ["AUX_DA"],
  pin22: ["NCS"],
  pin23: ["SCL"],
  pin24: ["SDA"],
  pin25: ["EP"],
} as const

const pinAttributes = {
  pin1: { doNotConnect: true },
  pin2: { doNotConnect: true },
  pin3: { doNotConnect: true },
  pin4: { doNotConnect: true },
  pin5: { doNotConnect: true },
  pin6: { doNotConnect: true },
  pin13: { requiresPower: true },
  pin14: { doNotConnect: true },
  pin15: { doNotConnect: true },
  pin16: { doNotConnect: true },
  pin17: { doNotConnect: true },
  pin18: { requiresGround: true },
} as const

const footprinterPinLabels = {
  ...pinLabels,
  pin25: [...pinLabels["pin25"], "thermalpad"],
} as const

export const ICM_20948 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C726001"],
      }}
      manufacturerPartNumber="ICM-20948"
      footprint="qfn24_thermalpad1.7mmx1.7mm_p0.4mm_h3.56mm_pw0.2mm_pl0.51mm_pin1location(bottomside,left)"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C726001.obj?uuid=ee2e77f6ae6443fd8761dd68811b5307",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C726001.step?uuid=ee2e77f6ae6443fd8761dd68811b5307",
        pcbRotationOffset: 90,
        modelOriginPosition: {
          x: -0.000063500000123895,
          y: -0.000025399999913133797,
          z: 0,
        },
      }}
      {...props}
    />
  )
}
