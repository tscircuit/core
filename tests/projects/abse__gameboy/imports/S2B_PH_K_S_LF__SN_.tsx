import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const S2B_PH_K_S_LF__SN_ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C173752"],
      }}
      manufacturerPartNumber="S2B_PH_K_S_LF__SN_"
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            pcbX="0.97499805mm"
            pcbY="0mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.8499856mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="-1.02499795mm"
            pcbY="0mm"
            outerDiameter="1.3999972mm"
            holeDiameter="0.8499856mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: -3.0249939500000664, y: 6.200013000000126 },
              { x: 2.9749940500000776, y: 6.200013000000126 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.0249939500000664, y: 6.200013000000126 },
              { x: -3.0249939500000664, y: -1.400022599999943 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.9749940500000776, y: -1.400022599999943 },
              { x: 2.9749940500000776, y: 6.159017399999925 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.0249939500000664, y: -1.400022599999943 },
              { x: -2.0249959499999477, y: -1.400022599999943 },
              { x: -2.0249959499999477, y: 0.19999960000006922 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.9749432500001376, y: -1.399971800000003 },
              { x: 1.9749452500000189, y: -1.399971800000003 },
              { x: 1.9749452500000189, y: 0.19999960000006922 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0249959499999477, y: 0.19999960000006922 },
              { x: -2.0249959499999477, y: 4.000017400000047 },
              { x: -1.4249717499999406, y: 4.000017400000047 },
              { x: -1.4249717499999406, y: 0.19999960000006922 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3749718500000654, y: 0.19999960000006922 },
              { x: 1.3749718500000654, y: 4.000017400000047 },
              { x: 1.9749960499999588, y: 4.000017400000047 },
              { x: 1.9749960499999588, y: 0.19999960000006922 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0249979499999426, y: 6.200013000000126 },
              { x: -1.0249979499999426, y: 1.8999962000000323 },
              { x: 0.9749980499999538, y: 1.8999962000000323 },
              { x: 0.9749980499999538, y: 6.100038600000062 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0249959499999477, y: 0.19999960000006922 },
              { x: -2.006149149999942, y: 0.19999960000006922 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.043846750000057, y: 0.19999960000006922 },
              { x: -0.006153149999931884, y: 0.19999960000006922 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.956149249999953, y: 0.19999960000006922 },
              { x: 1.9749452500000189, y: 0.19999960000006922 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.02580005mm"
            pcbY="7.2992mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.3737999499999205, y: 6.549200000000155 },
              { x: 3.4254000500000075, y: 6.549200000000155 },
              { x: 3.4254000500000075, y: -1.8501999999998588 },
              { x: -3.3737999499999205, y: -1.8501999999998588 },
              { x: -3.3737999499999205, y: 6.549200000000155 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C173752.obj?uuid=79d113e028014698af46865c2d6c6799",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C173752.step?uuid=79d113e028014698af46865c2d6c6799",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.9750000500000624,
          y: 0.02500150000000767,
          z: -0.000006999999999646178,
        },
      }}
      {...props}
    />
  )
}
