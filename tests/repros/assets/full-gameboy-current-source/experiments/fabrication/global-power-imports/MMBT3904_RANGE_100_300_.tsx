import type { TransistorProps } from "@tscircuit/props"

type MMBT3904Props = Omit<TransistorProps, "type">

export const MMBT3904_RANGE_100_300_ = (props: MMBT3904Props) => {
  return (
    <transistor
      type="npn"
      supplierPartNumbers={{
        jlcpcb: ["C20526"],
      }}
      manufacturerPartNumber="MMBT3904_RANGE_100_300_"
      footprint="sot23w_p0.99mm_pw0.66mm_pin1location(rightside,bottom)"
      {...props}
    />
  )
}
