import { ReferenceLabel } from "../product/reference-label"
import type { ResistorProps } from "@tscircuit/props"

const pinAttributes = {
  pin2: {isPassive: true},
  pin1: {isPassive: true}
} satisfies NonNullable<ResistorProps["pinAttributes"]>

export const A_0402WGF1001TCE = (props: Omit<ResistorProps, "resistance">) => {
  const { name = "R1", ...restProps } = props

  return (
    <resistor
      name={name}
      resistance="1kohm"
      supplierPartNumbers={{
  "jlcpcb": [
    "C11702"
  ]
}}
      manufacturerPartNumber="0402WGF1001TCE"
      pinAttributes={pinAttributes}
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="0.432816mm" pcbY="0mm" width="0.565658mm" height="0.540004mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-0.432816mm" pcbY="0mm" width="0.565658mm" height="0.540004mm" shape="rect" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-0.9656450000001087,"y":0.5200019999999768},{"x":0.965644999999995,"y":0.5200019999999768},{"x":0.965644999999995,"y":-0.5200019999999768},{"x":-0.9656450000001087,"y":-0.5200019999999768},{"x":-0.9656450000001087,"y":0.5200019999999768}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C11702.obj?uuid=026a4a15ab5c4a92ac0e421d6d013717",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C11702.step?uuid=026a4a15ab5c4a92ac0e421d6d013717",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: 0 },
      }}
      {...restProps}
    />
  )
}