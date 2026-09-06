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
      variant="schottky"
      supplierPartNumbers={{
        jlcpcb: ["C8678"],
      }}
      manufacturerPartNumber="SS34"
      footprint="res_p4.4mm_pw2mm_ph2mm"
      {...restProps}
    />
  )
}
