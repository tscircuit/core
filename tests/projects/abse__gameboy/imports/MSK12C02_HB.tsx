import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin4_alt1"],
  pin6: ["pin4_alt1"],
  pin7: ["pin4_alt1"]
} as const

export const MSK12C02_HB = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C431541"
  ]
}}
      manufacturerPartNumber="MSK12C02_HB"
      footprint={<footprint>
        <hole pcbX="1.500124mm" pcbY="-0.75603735mm" diameter="0.9000236mm" />
<hole pcbX="-1.49987mm" pcbY="-0.75603735mm" diameter="0.9000236mm" />
<smtpad portHints={["pin1"]} pcbX="-2.249932mm" pcbY="1.49389465mm" width="0.5999988mm" height="1.524mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0.750062mm" pcbY="1.49389465mm" width="0.5999988mm" height="1.524mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="2.250186mm" pcbY="1.49389465mm" width="0.5999988mm" height="1.524mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-3.599942mm" pcbY="0.39407465mm" width="1.1999976mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-3.599942mm" pcbY="-1.90589535mm" width="1.1999976mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="3.599942mm" pcbY="-1.90589535mm" width="1.1999976mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="3.599942mm" pcbY="0.39407465mm" width="1.1999976mm" height="0.6999986mm" shape="rect" />
<silkscreenpath route={[{"x":3.301060199999938,"y":-0.20600035000006756},{"x":3.301060199999938,"y":-1.3436663500001487}]} />
<silkscreenpath route={[{"x":-3.216300399999909,"y":-1.3436663500001487},{"x":-3.216300399999909,"y":-0.20600035000006756}]} />
<silkscreenpath route={[{"x":0.22324059999994006,"y":-3.775182950000044},{"x":1.4983206000000564,"y":-3.775182950000044},{"x":1.4983206000000564,"y":-2.174982949999958}]} />
<silkscreenpath route={[{"x":-2.7499564000000873,"y":-2.1559329500000786},{"x":2.7500579999999673,"y":-2.1559329500000786}]} />
<silkscreenpath route={[{"x":0.2229866000000129,"y":-2.1747797500000843},{"x":0.2229866000000129,"y":-3.7748019499999828}]} />
<silkscreenpath route={[{"x":2.768904799999973,"y":0.7439850499998784},{"x":2.7589226000000053,"y":0.7439850499998784}]} />
<silkscreenpath route={[{"x":1.7189195999999356,"y":0.7439850499998784},{"x":1.2811760000000731,"y":0.7439850499998784}]} />
<silkscreenpath route={[{"x":0.21892259999992802,"y":0.7439850499998784},{"x":-1.7188180000000557,"y":0.7439850499998784}]} />
<silkscreentext text="{NAME}" pcbX="0.00508mm" pcbY="3.25360865mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.448620000000005,"y":2.503608649999933},{"x":4.458779999999933,"y":2.503608649999933},{"x":4.458779999999933,"y":-4.06699135000008},{"x":-4.448620000000005,"y":-4.06699135000008},{"x":-4.448620000000005,"y":2.503608649999933}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C431541.obj?uuid=52f1cee24f744214bc077f746cfb201a",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C431541.step?uuid=52f1cee24f744214bc077f746cfb201a",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.7529190500000822, z: -0.0000011000000000871424 },
      }}
      {...props}
    />
  )
}