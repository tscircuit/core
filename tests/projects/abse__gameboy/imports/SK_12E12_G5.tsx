import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"]
} as const

export const SK_12E12_G5 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C136720"
  ]
}}
      manufacturerPartNumber="SK_12E12_G5"
      footprint={<footprint>
        <platedhole  portHints={["pin2"]} pcbX="0mm" pcbY="0.127mm" outerDiameter="1.524mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="0mm" pcbY="-2.921mm" outerDiameter="1.524mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin1"]} pcbX="0mm" pcbY="3.175mm" outerDiameter="1.524mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin4"]} pcbX="0mm" pcbY="-6.477mm" outerDiameter="2.1999956mm" holeDiameter="1.5000224mm" shape="circle" />
<platedhole  portHints={["pin5"]} pcbX="0mm" pcbY="6.477mm" outerDiameter="2.1999956mm" holeDiameter="1.5000224mm" shape="circle" />
<silkscreenpath route={[{"x":2.793999999999997,"y":-6.477000000000004},{"x":-2.793999999999997,"y":-6.477000000000004},{"x":-2.793999999999997,"y":6.477000000000004},{"x":2.793999999999997,"y":6.477000000000004},{"x":2.793999999999997,"y":-6.477000000000004}]} />
<silkscreenpath route={[{"x":2.0319999999999965,"y":3.174999999999997},{"x":2.0319999999999965,"y":0.12699999999999534}]} />
<silkscreenpath route={[{"x":2.793999999999997,"y":3.174999999999997},{"x":8.127999999999986,"y":3.174999999999997},{"x":8.127999999999986,"y":0.12699999999999534},{"x":2.793999999999997,"y":0.12699999999999534}]} />
<silkscreentext text="{NAME}" pcbX="2.667mm" pcbY="8.6708mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-3.043999999999997,"y":7.9208},{"x":8.377999999999986,"y":7.9208},{"x":8.377999999999986,"y":-7.946200000000005},{"x":-3.043999999999997,"y":-7.946200000000005},{"x":-3.043999999999997,"y":7.9208}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C136720.obj?uuid=694c4159502149fba0ae406b87d40894",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C136720.step?uuid=694c4159502149fba0ae406b87d40894",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012699999999199463, y: 0.3670000000000013, z: -0.5500069999999995 },
      }}
      {...props}
    />
  )
}