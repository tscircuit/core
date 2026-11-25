import { ReferenceLabel } from "../product/reference-label"
import type { CapacitorProps } from "@tscircuit/props"

const pinAttributes = {
  pin2: {isPassive: true},
  pin1: {isPassive: true}
} satisfies NonNullable<CapacitorProps["pinAttributes"]>

export const CL05B104KO5NNNC = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      maxVoltageRating="16V"
      name={name}
      capacitance="100nF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C1525"
  ]
}}
      manufacturerPartNumber="CL05B104KO5NNNC"
      pinAttributes={pinAttributes}
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="0.420116mm" pcbY="0mm" width="0.499999mm" height="0.540004mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-0.420116mm" pcbY="0mm" width="0.499999mm" height="0.540004mm" shape="rect" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-0.9201154999999517,"y":0.5200019999999768},{"x":0.9201154999999517,"y":0.5200019999999768},{"x":0.9201154999999517,"y":-0.5200019999999768},{"x":-0.9201154999999517,"y":-0.5200019999999768},{"x":-0.9201154999999517,"y":0.5200019999999768}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1525.obj?uuid=32fe2cf9314f444ca2785a33c2db7189",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1525.step?uuid=32fe2cf9314f444ca2785a33c2db7189",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.25 },
      }}
      {...restProps}
    />
  )
}