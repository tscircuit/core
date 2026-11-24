import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["EH1"],
  pin2: ["EH2"],
  pin3: ["EH3"],
  pin4: ["EH4"],
  pin5: ["GND1", "A12"],
  pin6: ["GND2", "B1"],
  pin7: ["VBUS1", "A9"],
  pin8: ["VBUS2", "B4"],
  pin9: ["CC2", "B5"],
  pin10: ["SBU1", "A8"],
  pin11: ["DP2", "B6"],
  pin12: ["DN1", "A7"],
  pin13: ["DP1", "A6"],
  pin14: ["DN2", "B7"],
  pin15: ["CC1", "A5"],
  pin16: ["SBU2", "B8"],
  pin17: ["VBUS3", "B9"],
  pin18: ["VBUS4", "A4"],
  pin19: ["GND3", "B12"],
  pin20: ["GND4", "A1"],
} as const

export const USB4105_GF_A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C3020560"],
      }}
      manufacturerPartNumber="USB4105-GF-A"
      footprint={
        <footprint>
          <hole pcbX="2.890012mm" pcbY="1.0646474mm" diameter="0.649986mm" />
          <hole pcbX="-2.890012mm" pcbY="1.0646474mm" diameter="0.649986mm" />
          <platedhole
            portHints={["pin1"]}
            pcbX="-4.320032mm"
            pcbY="1.5444534mm"
            holeWidth="0.700024mm"
            holeHeight="1.6999966mm"
            outerWidth="1.0999978mm"
            outerHeight="2.0999958mm"
            shape="pill"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="4.320032mm"
            pcbY="1.5444534mm"
            holeWidth="0.700024mm"
            holeHeight="1.6999966mm"
            outerWidth="1.0999978mm"
            outerHeight="2.0999958mm"
            shape="pill"
          />
          <platedhole
            portHints={["pin3"]}
            pcbX="4.320032mm"
            pcbY="-2.6356246mm"
            holeWidth="0.700024mm"
            holeHeight="1.3999972mm"
            outerWidth="1.0999978mm"
            outerHeight="1.7999964mm"
            shape="pill"
          />
          <platedhole
            portHints={["pin4"]}
            pcbX="-4.320032mm"
            pcbY="-2.6356246mm"
            holeWidth="0.700024mm"
            holeHeight="1.3999972mm"
            outerWidth="1.0999978mm"
            outerHeight="1.7999964mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="3.350006mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="3.050032mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="2.549906mm"
            pcbY="2.1098574mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="2.249932mm"
            pcbY="2.1098574mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.75006mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.24968mm"
            pcbY="2.1106194mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0.750062mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="0.249936mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-0.249936mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-0.750062mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-1.249934mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-1.75006mm"
            pcbY="2.1106194mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-2.249932mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-2.549906mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-3.050032mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-3.350006mm"
            pcbY="2.1096034mm"
            width="0.2999994mm"
            height="1.1500104mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 4.4699935999999525, y: -1.5190659999998388 },
              { x: 4.4699935999999525, y: 0.2778824000001805 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.469993600000066, y: -3.7522085999999035 },
              { x: -4.469993600000066, y: -5.254948799999966 },
              { x: 4.4699935999999525, y: -5.254948799999966 },
              { x: 4.4699935999999525, y: -3.7522085999999035 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.469993600000066, y: 0.2778824000001805 },
              { x: -4.469993600000066, y: -1.5190659999998388 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.018288mm"
            pcbY="3.6902474mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -5.120030900000074, y: 2.935624599999983 },
              { x: 5.120030900000074, y: 2.935624599999983 },
              { x: 5.120030900000074, y: -5.437511799999925 },
              { x: -5.120030900000074, y: -5.437511799999925 },
              { x: -5.120030900000074, y: 2.935624599999983 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C3020560.obj?uuid=b568c80088e44e7787ac98e18b16aaa3",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C3020560.step?uuid=b568c80088e44e7787ac98e18b16aaa3",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0,
          y: 1.5075092000000494,
          z: -0.0000020000000000575113,
        },
      }}
      {...props}
    />
  )
}
