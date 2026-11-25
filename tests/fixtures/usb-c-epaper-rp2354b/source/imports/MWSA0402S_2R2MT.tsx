import { ReferenceLabel } from "../product/reference-label"
import { supplierSolidModel } from "../product/supplier-solid-model"
import type { InductorProps } from "@tscircuit/props"

export const MWSA0402S_2R2MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="2.2uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C408335"
  ]
}}
      manufacturerPartNumber="MWSA0402S-2R2MT"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="2.027936mm" pcbY="0mm" width="1.3999972mm" height="2.120011mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="-2.027936mm" pcbY="0mm" width="1.3999972mm" height="2.120011mm" shape="rect" />
<silkscreenpath route={[{"x":-2.2761956000001646,"y":1.2123928000000888},{"x":-2.2761956000001646,"y":2.1761957999999595},{"x":2.276195600000051,"y":2.1761957999999595},{"x":2.276195600000051,"y":1.2123928000000888}]} />
<silkscreenpath route={[{"x":-2.2761956000001646,"y":-1.212392799999975},{"x":-2.2761956000001646,"y":-2.1761957999999595},{"x":2.276195600000051,"y":-2.1761957999999595},{"x":2.276195600000051,"y":-1.212392799999975}]} />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-2.9779345999999123,"y":2.349995799999988},{"x":2.9779345999997986,"y":2.349995799999988},{"x":2.9779345999997986,"y":-2.349995799999874},{"x":-2.9779345999999123,"y":-2.349995799999874},{"x":-2.9779345999999123,"y":2.349995799999988}]} />
      </footprint>}
      cadModel={supplierSolidModel("C408335",0)}
      {...props}
    />
  )
}
