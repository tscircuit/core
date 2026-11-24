import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const RM2512FBR008GM = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C5154825"],
      }}
      manufacturerPartNumber="RM2512FBR008GM"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="3.099943mm"
            pcbY="0mm"
            width="2.0999958mm"
            height="3.999992mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-3.099943mm"
            pcbY="0mm"
            width="2.0999958mm"
            height="3.999992mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -4.444974600000023, y: -2.1999956000000793 },
              { x: -4.444974600000023, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.445025399999963, y: 2.1999955999999656 },
              { x: 4.445025399999963, y: -2.1999956000000793 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.445025399999963, y: -2.1999956000000793 },
              { x: 1.9050253999998858, y: -2.1999956000000793 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.445025399999963, y: 2.1999955999999656 },
              { x: 1.9050253999998858, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.444974600000023, y: -2.1999956000000793 },
              { x: -1.9049746000001733, y: -2.1999956000000793 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.444974600000023, y: 2.1999955999999656 },
              { x: -1.9049746000001733, y: 2.1999955999999656 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.008255mm"
            pcbY="3.2098mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.399940900000047, y: 2.24999600000001 },
              { x: 4.399940900000047, y: 2.24999600000001 },
              { x: 4.399940900000047, y: -2.24999600000001 },
              { x: -4.399940900000047, y: -2.24999600000001 },
              { x: -4.399940900000047, y: 2.24999600000001 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C5154825.obj?uuid=86940c9ee0e84485a3b46b31e13b14ff",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C5154825.step?uuid=86940c9ee0e84485a3b46b31e13b14ff",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.00002539999979944696, y: 0, z: -0.01 },
      }}
      {...props}
    />
  )
}
