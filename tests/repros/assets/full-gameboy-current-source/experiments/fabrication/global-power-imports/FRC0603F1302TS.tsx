import type { ResistorProps } from "@tscircuit/props"

type FRC0603F1302TSProps = Omit<ResistorProps, "resistance">

export const FRC0603F1302TS = (props: FRC0603F1302TSProps) => {
  return (
    <resistor
      resistance="13k"
      supplierPartNumbers={{
        jlcpcb: ["C2906992"],
      }}
      manufacturerPartNumber="FRC0603F1302TS"
      footprint="res_p1.51mm_pw0.81mm_ph0.86mm"
      {...props}
    />
  )
}
