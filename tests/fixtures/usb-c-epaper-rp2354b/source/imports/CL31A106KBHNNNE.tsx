import { supplierSolidModel } from "../product/supplier-solid-model"
import { ReferenceLabel } from "../product/reference-label"
import type { CapacitorProps } from "@tscircuit/props"

export const CL31A106KBHNNNE = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      maxVoltageRating="50V"
      name={name}
      capacitance="10uF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C13585"
  ]
}}
      manufacturerPartNumber="CL31A106KBHNNNE"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="1.59258mm" pcbY="0mm" width="1.485011mm" height="1.7279874mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-1.59258mm" pcbY="0mm" width="1.485011mm" height="1.7279874mm" shape="rect" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-2.585085499999991,"y":1.1139937000000373},{"x":2.5850854999998774,"y":1.1139937000000373},{"x":2.5850854999998774,"y":-1.1139937000000373},{"x":-2.585085499999991,"y":-1.1139937000000373},{"x":-2.585085499999991,"y":1.1139937000000373}]} />
      </footprint>}
      cadModel={supplierSolidModel("C13585", 0)}
      {...restProps}
    />
  )
}