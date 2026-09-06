import type { CapacitorProps } from "@tscircuit/props"

type CL10A226MQ8NRNCProps = Omit<CapacitorProps, "capacitance">

export const CL10A226MQ8NRNC = (props: CL10A226MQ8NRNCProps) => {
  return (
    <capacitor
      capacitance="22uF"
      supplierPartNumbers={{
        jlcpcb: ["C59461"],
      }}
      manufacturerPartNumber="CL10A226MQ8NRNC"
      footprint="res_p1.4mm_pw0.8mm_ph0.9mm"
      {...props}
    />
  )
}
