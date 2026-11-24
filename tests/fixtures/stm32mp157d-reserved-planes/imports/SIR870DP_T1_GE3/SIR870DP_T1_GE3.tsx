import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["S3"],
  pin2: ["S2"],
  pin3: ["S1"],
  pin4: ["G"],
  pin5: ["D4"],
  pin6: ["D3"],
  pin7: ["D2"],
  pin8: ["D1"],
  pin9: ["pin9"],
} as const

export const SIR870DP_T1_GE3 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C467951"],
      }}
      manufacturerPartNumber="SIR870DP-T1-GE3"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin9"]}
            pcbX="0mm"
            pcbY="0.630047mm"
            width="3.9800022mm"
            height="3.6599876mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-1.905mm"
            pcbY="2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.635mm"
            pcbY="2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.635mm"
            pcbY="2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.905mm"
            pcbY="2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="1.905mm"
            pcbY="-2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.635mm"
            pcbY="-2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.635mm"
            pcbY="-2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.905mm"
            pcbY="-2.850007mm"
            width="0.6999986mm"
            height="0.999998mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 2.435148799999979, y: -3.049879600000054 },
              { x: 2.499994999999899, y: -3.049879600000054 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.1651487999998835, y: -3.049879600000054 },
              { x: 1.3748511999999664, y: -3.049879600000054 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.1048511999999846, y: -3.049879600000054 },
              { x: 0.1048511999999846, y: -3.049879600000054 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3748511999999664, y: -3.049879600000054 },
              { x: -1.1651487999999972, y: -3.049879600000054 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4999950000001263, y: -3.049879600000054 },
              { x: -2.435148799999979, y: -3.049879600000054 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.435148799999979, y: 2.95010840000009 },
              { x: 2.499994999999899, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.1651487999998835, y: 2.95010840000009 },
              { x: 1.3748511999999664, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.1048511999999846, y: 2.95010840000009 },
              { x: 0.1048511999999846, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3748511999999664, y: 2.95010840000009 },
              { x: -1.1651487999999972, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4999950000001263, y: 2.95010840000009 },
              { x: -2.435148799999979, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.4851360000000113, y: 2.95010840000009 },
              { x: 2.499994999999899, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4851360000000113, y: -3.049879600000054 },
              { x: -2.4999950000001263, y: -3.049879600000054 },
              { x: -2.4999950000001263, y: 2.95010840000009 },
              { x: -2.4851360000000113, y: 2.95010840000009 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.499994999999899, y: 2.95010840000009 },
              { x: 2.499994999999899, y: -3.049879600000054 },
              { x: 2.4851360000000113, y: -3.049879600000054 },
            ]}
          />
          <silkscreencircle
            pcbX="-2.659888mm"
            pcbY="-3.474847mm"
            radius="0.150114mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.127mm"
            pcbY="4.342513mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.824975800000175, y: 3.6000060000000076 },
              { x: 2.8250011999999742, y: 3.6000060000000076 },
              { x: 2.8250011999999742, y: -3.6000060000001213 },
              { x: -2.824975800000175, y: -3.6000060000001213 },
              { x: -2.824975800000175, y: 3.6000060000000076 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C467951.obj?uuid=b858172e896646eba3ee6d96e3786fc0",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C467951.step?uuid=b858172e896646eba3ee6d96e3786fc0",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.000012699999842880061,
          y: -0.000012700000070253736,
          z: -0.01,
        },
      }}
      {...props}
    />
  )
}
