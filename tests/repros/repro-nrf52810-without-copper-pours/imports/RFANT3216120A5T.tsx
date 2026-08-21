import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["FEED"],
  pin2: ["NC"],
} as const

export const RFANT3216120A5T = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C127629"],
      }}
      manufacturerPartNumber="RFANT3216120A5T"
      footprint="res_p3.1001mm_pw0.8mm_ph1.66mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C127629.obj?uuid=ad99fc1789904603aa1325d0ded16988",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C127629.step?uuid=ad99fc1789904603aa1325d0ded16988",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.6 },
      }}
      {...props}
    />
  )
}
