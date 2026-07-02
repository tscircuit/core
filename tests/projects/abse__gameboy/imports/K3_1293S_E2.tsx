import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"]
} as const

export const K3_1293S_E2 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C145852"
  ]
}}
      manufacturerPartNumber="K3_1293S_E2"
      footprint={<footprint>
        <hole pcbX="-0.6252718mm" pcbY="1.50114mm" diameter="0.9000236mm" />
<hole pcbX="-0.6252718mm" pcbY="-1.50114mm" diameter="0.9000236mm" />
<smtpad portHints={["pin1"]} pcbX="1.3253466mm" pcbY="0.999998mm" width="1.6999966mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.3253466mm" pcbY="0mm" width="1.6999966mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.3253466mm" pcbY="-0.999998mm" width="1.6999966mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.7253458mm" pcbY="-2.7999944mm" width="0.8999982mm" height="1.0999978mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0.4745482mm" pcbY="-2.7999944mm" width="0.8999982mm" height="1.0999978mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.4745482mm" pcbY="2.7999944mm" width="0.8999982mm" height="1.0999978mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-1.7253458mm" pcbY="2.7999944mm" width="0.8999982mm" height="1.0999978mm" shape="rect" />
<silkscreenpath route={[{"x":-1.9839940000000524,"y":-2.0188682000000426},{"x":-1.9839940000000524,"y":-0.556996599999934}]} />
<silkscreenpath route={[{"x":-0.20657820000008087,"y":-2.5239979999998923},{"x":-1.0442193999999745,"y":-2.5239979999998923}]} />
<silkscreenpath route={[{"x":0.7629905999998527,"y":-1.5811499999999796},{"x":0.7629905999998527,"y":-2.0188682000000426}]} />
<silkscreenpath route={[{"x":0.7629905999998527,"y":2.018842800000016},{"x":0.7629905999998527,"y":1.5811500000000933}]} />
<silkscreenpath route={[{"x":-1.0442193999999745,"y":2.5269952000001012},{"x":-0.20657820000008087,"y":2.5269952000001012}]} />
<silkscreenpath route={[{"x":-1.9752564000000348,"y":0.5388355999999703},{"x":-1.9752564000000348,"y":2.018842800000016}]} />
<silkscreenpath route={[{"x":-1.9752564000000348,"y":0.5388355999999703},{"x":-3.483000400000037,"y":0.5388355999999703},{"x":-3.483000400000037,"y":-0.556996599999934},{"x":-1.9752564000000348,"y":-0.556996599999934}]} />
<silkscreentext text="{NAME}" pcbX="-0.6633718mm" pcbY="4.3528mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-3.745471800000132,"y":3.6027999999998883},{"x":2.418728199999805,"y":3.6027999999998883},{"x":2.418728199999805,"y":-3.602800000000002},{"x":-3.745471800000132,"y":-3.602800000000002},{"x":-3.745471800000132,"y":3.6027999999998883}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C145852.obj?uuid=95433a36dfd14ae9b2200791e87bd7e9",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C145852.step?uuid=95433a36dfd14ae9b2200791e87bd7e9",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.9300088000000214, y: 0, z: -0.700001 },
      }}
      {...props}
    />
  )
}