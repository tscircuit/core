import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const PM254_1_02_Z_8_5 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2897365"],
      }}
      manufacturerPartNumber="PM254-1-02-Z-8.5"
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            pcbX="-1.27mm"
            pcbY="0mm"
            holeWidth="0.999998mm"
            holeHeight="0.999998mm"
            outerWidth="1.6999966mm"
            outerHeight="1.6999966mm"
            rectPad={true}
            pcbRotation="0deg"
            shape="pill"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="1.27mm"
            pcbY="0mm"
            outerDiameter="1.6999966mm"
            holeDiameter="0.999998mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: 2.739999600000033, y: 1.249984799999993 },
              { x: 2.739999600000033, y: -1.2500101999999913 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.739999599999919, y: 1.249984799999993 },
              { x: 2.739999600000033, y: 1.249984799999993 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.739999599999919, y: -1.2500101999999913 },
              { x: -2.739999599999919, y: 1.249984799999993 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.739999600000033, y: -1.2500101999999913 },
              { x: -2.739999599999919, y: -1.2500101999999913 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0127mm"
            pcbY="2.2446mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.989999599999919, y: 1.499984799999993 },
              { x: 2.989999600000033, y: 1.499984799999993 },
              { x: 2.989999600000033, y: -1.5000101999999913 },
              { x: -2.989999599999919, y: -1.5000101999999913 },
              { x: -2.989999599999919, y: 1.499984799999993 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2897365.obj?uuid=28e6a500062449509945fff1f5fb41b0",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2897365.step?uuid=28e6a500062449509945fff1f5fb41b0",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0,
          y: 0.000012699999984988608,
          z: -0.00000660000000030081,
        },
      }}
      {...props}
    />
  )
}
