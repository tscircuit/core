import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode", "neg"],
  pin2: ["anode", "pos"],
} as const

export const SS34 = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{ jlcpcb: ["C8678"] }}
      manufacturerPartNumber="SS34"
      footprint="res_p4.3998mm_pw2mm_ph2mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C8678.obj?uuid=e3551acb3c5a4975a5e9d36087fe1fa2",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C8678.step?uuid=e3551acb3c5a4975a5e9d36087fe1fa2",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.000012699999842880061,
          y: 0,
          z: -0.1,
        },
      }}
      {...restProps}
    />
  )
}
