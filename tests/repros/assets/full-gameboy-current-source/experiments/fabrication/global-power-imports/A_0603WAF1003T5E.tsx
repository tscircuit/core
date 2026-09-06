import type { ResistorProps } from "@tscircuit/props"

type A0603WAF1003T5EProps = Omit<ResistorProps, "resistance">

export const A_0603WAF1003T5E = (props: A0603WAF1003T5EProps) => {
  return (
    <resistor
      resistance="100k"
      supplierPartNumbers={{
        jlcpcb: ["C25803"],
      }}
      manufacturerPartNumber="A_0603WAF1003T5E"
      footprint="res_p1.51mm_pw0.81mm_ph0.86mm"
      {...props}
    />
  )
}
