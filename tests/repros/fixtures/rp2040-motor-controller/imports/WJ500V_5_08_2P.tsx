import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const WJ500V_5_08_2P = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C8465"],
      }}
      manufacturerPartNumber="WJ500V_5_08_2P"
      footprint={
        <footprint>
          <platedhole
            portHints={["pin2"]}
            pcbX="2.54mm"
            pcbY="0mm"
            outerDiameter="1.999996mm"
            holeDiameter="1.3000228mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin1"]}
            pcbX="-2.54mm"
            pcbY="0mm"
            outerDiameter="1.999996mm"
            holeDiameter="1.3000228mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: 5.079999999999998, y: 5.637529999999998 },
              { x: -5.053837999999999, y: 5.637529999999998 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.679998799999993, y: -3.7500051999999897 },
              { x: -5.0800000000000125, y: -3.499967599999991 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.679998799999993, y: -2.750007199999999 },
              { x: -5.679998799999993, y: -3.7500051999999897 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.0800000000000125, y: -3.000070199999996 },
              { x: -5.679998799999993, y: -2.750007199999999 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.0800000000000125, y: 4.500016400000007 },
              { x: -5.679998799999993, y: 4.750003200000009 },
              { x: -5.679998799999993, y: 3.7499798000000055 },
              { x: -5.0800000000000125, y: 3.999890399999998 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.079999999999998, y: -4.522469999999984 },
              { x: -5.053837999999999, y: -4.522469999999984 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.079999999999998, y: -4.522469999999984 },
              { x: 5.079999999999998, y: 5.637529999999998 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.0800000000000125, y: -4.519930000000002 },
              { x: -5.0800000000000125, y: 5.640070000000009 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.2413mm"
            pcbY="6.6388mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -5.939599999999999, y: 5.888800000000003 },
              { x: 5.456999999999994, y: 5.888800000000003 },
              { x: 5.456999999999994, y: -4.771199999999993 },
              { x: -5.939599999999999, y: -4.771199999999993 },
              { x: -5.939599999999999, y: 5.888800000000003 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C8465.obj?uuid=d60ef5d423934d3393dc75fa0a07b6bd",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C8465.step?uuid=d60ef5d423934d3393dc75fa0a07b6bd",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -2.5399878999999967,
          y: 0,
          z: -0.000006999999999646178,
        },
      }}
      {...props}
    />
  )
}
