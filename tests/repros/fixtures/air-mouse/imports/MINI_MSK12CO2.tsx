import type { SwitchProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin4_alt1"],
  pin7: ["pin5_alt1"],
} as const

export const MINI_MSK12CO2 = (props: SwitchProps) => {
  const { name = "SW1", ...restProps } = props

  return (
    <switch
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2681570"],
      }}
      manufacturerPartNumber="MINI_MSK12CO2"
      footprint={
        <footprint>
          <hole pcbX="-1.49987mm" pcbY="-0.52501165mm" diameter="0.9000236mm" />
          <hole pcbX="1.500124mm" pcbY="-0.52501165mm" diameter="0.9000236mm" />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.999998mm"
            pcbY="1.27508635mm"
            width="0.6999986mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="1.27508635mm"
            width="0.6999986mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.999998mm"
            pcbY="1.27508635mm"
            width="0.6999986mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-2.750058mm"
            pcbY="0.57506235mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="2.750058mm"
            pcbY="0.57506235mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-2.750058mm"
            pcbY="-1.62508565mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="2.750058mm"
            pcbY="-1.62508565mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.250012199999901, y: -2.0249832499998774 },
              { x: 2.0188682000000426, y: -2.0249832499998774 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.25008839999986776, y: -2.0249832499998774 },
              { x: 0.25008839999986776, y: -3.525005649999912 },
              { x: -1.4999716000000944, y: -3.525005649999912 },
              { x: -1.4999716000000944, y: -2.075072050000017 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.637842800000044, y: -2.0249832499998774 },
              { x: -2.018868199999929, y: -2.0249832499998774 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.250012199999901, y: -2.0249832499998774 },
              { x: -1.637842800000044, y: -2.0249832499998774 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.695219400000042, y: -0.07492364999984602 },
              { x: 2.695219400000042, y: -1.0126662499999384 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5824199999999564, y: 1.2522263500000008 },
              { x: -3.175000000000068, y: 1.2522263500000008 },
              { x: -3.175000000000068, y: 1.2065063500000406 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.723413399999913, y: -0.06547484999998687 },
              { x: -2.723413399999913, y: -1.0032428499999924 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.5811499999999796, y: 1.2530645500002038 },
              { x: 3.1749999999999545, y: 1.2530645500002038 },
              { x: 3.1749999999999545, y: 1.206176150000033 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="3.03708635mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.5012000000001535, y: 2.2870863499999814 },
              { x: 3.501199999999926, y: 2.2870863499999814 },
              { x: 3.501199999999926, y: -3.902513649999946 },
              { x: -3.5012000000001535, y: -3.902513649999946 },
              { x: -3.5012000000001535, y: 2.2870863499999814 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2681570.obj?uuid=9db2c4691abf42c0949926509288ce1f",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2681570.step?uuid=9db2c4691abf42c0949926509288ce1f",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0,
          y: 0.5080057499998929,
          z: -0.0000010000000000287557,
        },
      }}
      {...restProps}
    />
  )
}
