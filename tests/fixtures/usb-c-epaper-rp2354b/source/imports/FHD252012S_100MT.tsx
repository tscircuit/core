import { ReferenceLabel } from "../product/reference-label"
import type { InductorProps } from "@tscircuit/props"

export const FHD252012S_100MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="10uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C602018"
  ]
}}
      manufacturerPartNumber="FHD252012S-100MT"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="0.950468mm" pcbY="0mm" width="0.999998mm" height="2.1999956mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-0.950468mm" pcbY="0mm" width="0.999998mm" height="2.1999956mm" shape="rect" />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-1.2445237999999108,"y":1.3209016000000702},{"x":1.255496600000015,"y":1.3209016000000702}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-1.2445237999999108,"y":-1.2952983999999788},{"x":1.255496600000015,"y":-1.2952983999999788}]} />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-1.7004670000000033,"y":1.3499977999999828},{"x":1.700467000000117,"y":1.3499977999999828},{"x":1.700467000000117,"y":-1.3499977999999828},{"x":-1.7004670000000033,"y":-1.3499977999999828},{"x":-1.7004670000000033,"y":1.3499977999999828}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C602018.obj?uuid=ad5e75685c10499c98bee356614f63c6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C602018.step?uuid=ad5e75685c10499c98bee356614f63c6",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.0001015999999935957, y: 0.0000762000000804619, z: -0.025 },
      }}
      {...props}
    />
  )
}