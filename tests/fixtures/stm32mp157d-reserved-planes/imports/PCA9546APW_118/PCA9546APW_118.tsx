import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A0"],
  pin2: ["A1"],
  pin3: ["RESET"],
  pin4: ["SD0"],
  pin5: ["SC0"],
  pin6: ["SD1"],
  pin7: ["SC1"],
  pin8: ["VSS"],
  pin9: ["SD2"],
  pin10: ["SC2"],
  pin11: ["SD3"],
  pin12: ["SC3"],
  pin13: ["A2"],
  pin14: ["SCL"],
  pin15: ["SDA"],
  pin16: ["VDD"],
} as const

const pinAttributes = {
  pin8: { requiresGround: true },
  pin16: { requiresPower: true },
} as const

export const PCA9546APW_118 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C149507"],
      }}
      manufacturerPartNumber="PCA9546APW,118"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.2750018mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.6249904mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.9750044mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.324993mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.324993mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.9750044mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.6249904mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="2.2750018mm"
            pcbY="-2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="2.2750018mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.6249904mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0.9750044mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="0.324993mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-0.324993mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-0.9750044mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-1.6249904mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-2.2750018mm"
            pcbY="2.800096mm"
            width="0.3999992mm"
            height="1.7999964mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 2.7999944000000028, y: 2.2999954000000145 },
              { x: 2.7999944000000028, y: -2.299995399999986 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7999944000000028, y: 2.2999954000000145 },
              { x: -2.7999944000000028, y: -2.299995399999986 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7999944000000028, y: 2.2999954000000145 },
              { x: -2.707639999999998, y: 2.2999954000000145 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.707639999999998, y: 2.2999954000000145 },
              { x: 2.7999944000000028, y: 2.2999954000000145 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7999944000000028, y: -2.299995399999986 },
              { x: -2.707639999999998, y: -2.299995399999986 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.707639999999998, y: -2.299995399999986 },
              { x: 2.7999944000000028, y: -2.299995399999986 },
            ]}
          />
          <silkscreencircle
            pcbX="-2.8194mm"
            pcbY="-2.9972mm"
            radius="0.091694mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0508mm"
            pcbY="4.7084mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.7499949999999984, y: 3.9500942000000094 },
              { x: 2.7499950000000126, y: 3.9500942000000094 },
              { x: 2.7499950000000126, y: -3.9500941999999952 },
              { x: -2.7499949999999984, y: -3.9500941999999952 },
              { x: -2.7499949999999984, y: 3.9500942000000094 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C149507.obj?uuid=6700d6d15a364706b92d80c3904bd9ef",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C149507.step?uuid=6700d6d15a364706b92d80c3904bd9ef",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
