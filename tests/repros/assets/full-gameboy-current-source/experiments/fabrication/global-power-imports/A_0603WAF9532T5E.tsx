import type { ResistorProps } from "@tscircuit/props"

type A0603WAF9532T5EProps = Omit<ResistorProps, "resistance">

export const A_0603WAF9532T5E = (props: A0603WAF9532T5EProps) => {
  return (
    <resistor
      resistance="95.3k"
      supplierPartNumbers={{
        jlcpcb: ["C23267"],
      }}
      manufacturerPartNumber="A_0603WAF9532T5E"
      footprint="res_p1.51mm_pw0.81mm_ph0.86mm"
      {...props}
    />
  )
}
