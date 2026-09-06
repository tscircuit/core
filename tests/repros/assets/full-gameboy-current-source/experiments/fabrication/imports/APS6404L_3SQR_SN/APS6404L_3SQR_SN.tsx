import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_CE"],
  pin2: ["SIO1"],
  pin3: ["SIO2"],
  pin4: ["VSS"],
  pin5: ["SIO0"],
  pin6: ["SCLK"],
  pin7: ["SIO3"],
  pin8: ["VDD"],
} as const

const pinAttributes = {
  pin4: { requiresGround: true },
  pin8: { requiresPower: true },
} as const

export const APS6404L_3SQR_SN = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C5333729"],
      }}
      manufacturerPartNumber="APS6404L-3SQR-SN"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin5"]}
            pcbX="1.905mm"
            pcbY="2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.635mm"
            pcbY="2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.635mm"
            pcbY="2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-1.905mm"
            pcbY="2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="1.905mm"
            pcbY="-2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.635mm"
            pcbY="-2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.635mm"
            pcbY="-2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.905mm"
            pcbY="-2.599944mm"
            width="0.58801mm"
            height="1.7999964mm"
            radius="0.294005mm"
            shape="pill"
          />
          <silkscreenpath
            route={[
              { x: -2.5262078000000656, y: -1.5214091999999937 },
              { x: 2.526207799999952, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5262078000000656, y: 1.5214092000001074 },
              { x: 2.526207799999952, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5262078000000656, y: -0.43538139999998293 },
              { x: -2.5262078000000656, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5262078000000656, y: 0.44889420000004066 },
              { x: -2.5262078000000656, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0675600000000713, y: -1.5214091999999937 },
              { x: -2.5262078000000656, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.7975599999999758, y: -1.5214091999999937 },
              { x: -1.7424400000001015, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.47244000000000597, y: -1.5214091999999937 },
              { x: -0.47244000000011965, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.7424399999999878, y: -1.5214091999999937 },
              { x: 0.7975599999999758, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.526207799999952, y: -1.5214091999999937 },
              { x: 2.0675599999999577, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.526207799999952, y: 1.5214092000001074 },
              { x: 2.526207799999952, y: -1.5214091999999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0675600000000713, y: 1.5214092000001074 },
              { x: -2.5262078000000656, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.7975599999999758, y: 1.5214092000001074 },
              { x: -1.7424400000001015, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.47244000000000597, y: 1.5214092000001074 },
              { x: -0.47244000000011965, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.7424399999999878, y: 1.5214092000001074 },
              { x: 0.7975599999999758, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.526207799999952, y: 1.5214092000001074 },
              { x: 2.0675599999999577, y: 1.5214092000001074 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5262078000000656, y: -0.43538139999998293 },
              { x: -2.5262078000000656, y: 0.44889420000004066 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.905mm"
            pcbY="-1.016mm"
            radius="0.150114mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0127mm"
            pcbY="4.2004mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.764599999999973, y: 3.4504000000000588 },
              { x: 2.7899999999999636, y: 3.4504000000000588 },
              { x: 2.7899999999999636, y: -3.80600000000004 },
              { x: -2.764599999999973, y: -3.80600000000004 },
              { x: -2.764599999999973, y: 3.4504000000000588 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
