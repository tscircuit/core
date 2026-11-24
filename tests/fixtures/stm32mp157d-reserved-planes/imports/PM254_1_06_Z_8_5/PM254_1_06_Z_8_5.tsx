import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
} as const

export const PM254_1_06_Z_8_5 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2897369"],
      }}
      manufacturerPartNumber="PM254-1-06-Z-8.5"
      footprint={
        <footprint>
          <platedhole
            portHints={["pin6"]}
            pcbX="6.3999999mm"
            pcbY="0mm"
            outerDiameter="1.5999968mm"
            holeDiameter="1.0200132mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin5"]}
            pcbX="3.8599999mm"
            pcbY="0mm"
            outerDiameter="1.5999968mm"
            holeDiameter="1.0200132mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin4"]}
            pcbX="1.3199999mm"
            pcbY="0mm"
            outerDiameter="1.5999968mm"
            holeDiameter="1.0200132mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin3"]}
            pcbX="-1.2200001mm"
            pcbY="0mm"
            outerDiameter="1.5999968mm"
            holeDiameter="1.0200132mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="-3.7600001mm"
            pcbY="0mm"
            outerDiameter="1.5999968mm"
            holeDiameter="1.0200132mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin1"]}
            pcbX="-6.3000001mm"
            pcbY="0mm"
            holeWidth="1.0200132mm"
            holeHeight="1.0200132mm"
            outerWidth="1.7999964mm"
            outerHeight="1.7999964mm"
            rectPad={true}
            pcbRotation="0deg"
            shape="pill"
          />
          <silkscreenpath
            route={[
              { x: -5.030000099999938, y: 1.2499848 },
              { x: -5.030000099999938, y: -1.2499848 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -7.8199869000000035, y: -1.2499848 },
              { x: 7.919986700000038, y: -1.2499848 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -7.8199869000000035, y: 1.2499848 },
              { x: -7.8199869000000035, y: -1.2499848 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 7.919986700000038, y: 1.2499848 },
              { x: -7.8199869000000035, y: 1.2499848 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 7.919986700000038, y: -1.2499848 },
              { x: 7.919986700000038, y: 1.2499848 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0372999mm"
            pcbY="2.2446mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -8.069986900000004, y: 1.4499976000000032 },
              { x: 8.169961299999954, y: 1.4499976000000032 },
              { x: 8.169961299999954, y: -1.4499976000000032 },
              { x: -8.069986900000004, y: -1.4499976000000032 },
              { x: -8.069986900000004, y: 1.4499976000000032 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2897369.obj?uuid=c162e59987044c559654f3f6cf872bf9",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2897369.step?uuid=c162e59987044c559654f3f6cf872bf9",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.04998720000003232,
          y: 0,
          z: -0.0000064000000006281255,
        },
      }}
      {...props}
    />
  )
}
