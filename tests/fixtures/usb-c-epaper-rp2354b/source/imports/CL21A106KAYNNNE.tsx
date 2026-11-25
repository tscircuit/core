import { ReferenceLabel } from "../product/reference-label"
import type { CapacitorProps } from "@tscircuit/props"

const pinAttributes = {
  pin2: {isPassive: true},
  pin1: {isPassive: true}
} satisfies NonNullable<CapacitorProps["pinAttributes"]>

export const CL21A106KAYNNNE = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      maxVoltageRating="25V"
      name={name}
      capacitance="10uF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C15850"
  ]
}}
      manufacturerPartNumber="CL21A106KAYNNNE"
      pinAttributes={pinAttributes}
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="0.999998mm" pcbY="0mm" width="1.4100048mm" height="1.35001mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-0.999998mm" pcbY="0mm" width="1.4100048mm" height="1.35001mm" shape="rect" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-1.9550003999999035,"y":0.9250050000000556},{"x":1.9550003999999035,"y":0.9250050000000556},{"x":1.9550003999999035,"y":-0.9250050000000556},{"x":-1.9550003999999035,"y":-0.9250050000000556},{"x":-1.9550003999999035,"y":0.9250050000000556}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C15850.obj?uuid=b87ab0c5465a48b3a1c9a6dac8d30bc5",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C15850.step?uuid=b87ab0c5465a48b3a1c9a6dac8d30bc5",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.65 },
      }}
      {...restProps}
    />
  )
}