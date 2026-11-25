import { ReferenceLabel } from "../product/reference-label"
import type { ResistorProps } from "@tscircuit/props"

export const FBF05FT_R470_00L = (props: Omit<ResistorProps, "resistance">) => {
  const { name = "R1", ...restProps } = props

  return (
    <resistor
      name={name}
      resistance="470mohm"
      supplierPartNumbers={{
  "jlcpcb": [
    "C382278"
  ]
}}
      manufacturerPartNumber="FBF05FT-R470-00L"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="0.999998mm" pcbY="0mm" width="1.1325352mm" height="1.3770102mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-0.999998mm" pcbY="0mm" width="1.1325352mm" height="1.3770102mm" shape="rect" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-1.8162655999998378,"y":0.9385051000000431},{"x":1.8162655999998378,"y":0.9385051000000431},{"x":1.8162655999998378,"y":-0.9385051000000431},{"x":-1.8162655999998378,"y":-0.9385051000000431},{"x":-1.8162655999998378,"y":0.9385051000000431}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C382278.obj?uuid=c7acac53bcbc44d68fbab8f60a747688",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C382278.step?uuid=c7acac53bcbc44d68fbab8f60a747688",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999842880061, z: 0 },
      }}
      {...restProps}
    />
  )
}