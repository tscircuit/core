import type { PinHeaderProps } from "@tscircuit/props"

const pinLabels = {
  pin1: "pin1",
  pin2: "pin2",
  pin3: "pin3",
  pin4: "pin4",
  pin5: "pin5",
  pin6: "pin6",
  pin7: "pin7",
  pin8: "pin8",
  pin9: "pin9",
  pin10: "pin10",
  pin11: "pin11",
  pin12: "pin12",
  pin13: "pin13",
  pin14: "pin14",
} as const

export const B254N02_0B14P51_H85C32 = (
  props: Omit<PinHeaderProps, "pinCount">,
) => {
  return (
    <pinheader
      pinCount={14}
      pitch="2.54mm"
      gender="female"
      pinLabels={pinLabels}
      supplierPartNumbers={{ jlcpcb: ["C41426875"] }}
      manufacturerPartNumber="B254N02-0B14P51-H85C32"
      footprint="pinrow14_nosquareplating"
      {...props}
    />
  )
}
