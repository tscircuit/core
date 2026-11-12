import type { ChipProps } from "@tscircuit/props"

// Land dimensions verified against Johanson Rev 4.0, page 3: 4.2 mm outer span, 2.6 mm gap, 1.6 mm width.
const pinLabels = {
  pin1: ["ANT"],
  pin2: ["NC"],
} as const

export const A_2450AT18A100E = (props: ChipProps<typeof pinLabels>) => {
  return (
    <antenna
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematictext
            text={props.name}
            schX={0.5}
            schY={0}
            fontSize={0.18}
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: -0.2, y: 0.2 },
            ]}
            strokeColor="#8D2323"
          />
          <schematicpath
            points={[
              { x: 0.2, y: 0.2 },
              { x: 0, y: 0 },
            ]}
            strokeColor="#8D2323"
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0, y: -0.2 },
            ]}
            strokeColor="#8D2323"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["ANT"]}
            direction="down"
            schX={0}
            schY={-0.4}
            schStemLength={0.2}
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0, y: 0.3 },
            ]}
            strokeColor="#880000"
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="up"
            schX={0}
            schY={0.3}
            schStemLength={0.2}
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C89334"],
      }}
      manufacturerPartNumber="2450AT18A100E"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.7mm"
            pcbY="0mm"
            width="0.8mm"
            height="1.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.7mm"
            pcbY="0mm"
            width="0.8mm"
            height="1.6mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.7619999999998299, y: 0.2540000000000191 },
              { x: -0.7619999999998299, y: -0.2539999999999054 },
              { x: -0.2539999999999054, y: -0.2539999999999054 },
              { x: -0.2539999999999054, y: 0.2540000000000191 },
              { x: -0.7619999999998299, y: 0.2540000000000191 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.6759935999999698, y: 1.059967400000005 },
              { x: 1.6759936000000835, y: 1.0499852000000374 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.5240000000001146, y: -1.0500105999999505 },
              { x: -1.6759428000000298, y: -1.0499852000000374 },
            ]}
          />
          <fabricationnotepath
            route={[
              { x: -1.2597129999999197, y: 0.22793960000001334 },
              { x: -0.2838195999999016, y: 0.22793960000001334 },
              { x: -0.2838195999999016, y: -0.20652739999991354 },
              { x: -1.2599669999999605, y: -0.2116073999999344 },
              { x: -1.2597129999999197, y: -0.17978119999997944 },
              { x: -1.2597129999999197, y: 0.22793960000001334 },
            ]}
            strokeWidth="0.254mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.3330539999998336, y: 1.3167999999999438 },
              { x: 2.3325459999999794, y: 1.3167999999999438 },
              { x: 2.3325459999999794, y: -1.291400000000067 },
              { x: -2.3330539999998336, y: -1.291400000000067 },
              { x: -2.3330539999998336, y: 1.3167999999999438 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C89334.obj?uuid=cbaa998426f54032b453ce6fafc2cd5a",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C89334.step?uuid=cbaa998426f54032b453ce6fafc2cd5a",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: 0, z: -0.65 },
      }}
      {...props}
    />
  )
}
