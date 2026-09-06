import type { CapacitorProps } from "@tscircuit/props"

type CL10A106KP8NNNCProps = Omit<CapacitorProps, "capacitance">

export const CL10A106KP8NNNC = (props: CL10A106KP8NNNCProps) => {
  return (
    <capacitor
      capacitance="10uF"
      supplierPartNumbers={{
        jlcpcb: ["C19702"],
      }}
      manufacturerPartNumber="CL10A106KP8NNNC"
      footprint="res_p1.4mm_pw0.8mm_ph0.9mm"
      {...props}
    />
  )
}
