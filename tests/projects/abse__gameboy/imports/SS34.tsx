import type { DiodeProps } from "@tscircuit/props"

export const SS34 = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      supplierPartNumbers={{
  "jlcpcb": [
    "C8678"
  ]
}}
      manufacturerPartNumber="SS34"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="2.199894mm" pcbY="0mm" width="1.999996mm" height="1.999996mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-2.199894mm" pcbY="0mm" width="1.999996mm" height="1.999996mm" shape="rect" />
<silkscreenpath route={[{"x":-0.8839199999999892,"y":1.4262100000000828},{"x":-0.8839199999999892,"y":-1.4262099999999691}]} />
<silkscreenpath route={[{"x":-2.59618480000006,"y":1.4262100000000828},{"x":2.5961847999999463,"y":1.4262100000000828}]} />
<silkscreenpath route={[{"x":2.5932891999999583,"y":-1.1756136000000197},{"x":2.5999693999999636,"y":-1.4148308000000043}]} />
<silkscreenpath route={[{"x":2.5961847999999463,"y":1.4262100000000828},{"x":2.6028650000000653,"y":1.1869928000000982}]} />
<silkscreenpath route={[{"x":-2.59618480000006,"y":-1.4262099999999691},{"x":2.5961847999999463,"y":-1.4262099999999691}]} />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="2.4986mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-3.450399999999945,"y":1.7486000000000104},{"x":3.450399999999945,"y":1.7486000000000104},{"x":3.450399999999945,"y":-1.7485999999998967},{"x":-3.450399999999945,"y":-1.7485999999998967},{"x":-3.450399999999945,"y":1.7486000000000104}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C8678.obj?uuid=e3551acb3c5a4975a5e9d36087fe1fa2",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C8678.step?uuid=e3551acb3c5a4975a5e9d36087fe1fa2",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999842880061, y: 0, z: -0.1 },
      }}
      {...restProps}
    />
  )
}