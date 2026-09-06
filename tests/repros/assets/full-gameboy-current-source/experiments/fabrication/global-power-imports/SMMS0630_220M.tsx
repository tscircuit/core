import type { InductorProps } from "@tscircuit/props"

type SMMS0630_220MProps = Omit<InductorProps, "inductance">

export const SMMS0630_220M = (props: SMMS0630_220MProps) => {
  return (
    <inductor
      inductance="22uH"
      supplierPartNumbers={{
        jlcpcb: ["C128694"],
      }}
      manufacturerPartNumber="SMMS0630_220M"
      footprint="res_p6.16mm_pw2.52mm_ph3.12mm"
      {...props}
    />
  )
}
