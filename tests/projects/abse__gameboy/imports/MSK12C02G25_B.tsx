import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin5_alt1"],
  pin7: ["pin4_alt1"],
} as const

export const MSK12C02G25_B = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C22435663"],
      }}
      manufacturerPartNumber="MSK12C02G25_B"
      footprint={
        <footprint>
          <hole pcbX="-1.500124mm" pcbY="0.49994185mm" diameter="0.7999984mm" />
          <hole pcbX="1.49987mm" pcbY="0.49994185mm" diameter="0.7999984mm" />
          <smtpad
            portHints={["pin1"]}
            pcbX="2.249932mm"
            pcbY="-1.50005415mm"
            width="0.5999988mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.750062mm"
            pcbY="-1.50005415mm"
            width="0.5999988mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-2.249932mm"
            pcbY="-1.50005415mm"
            width="0.5999988mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-3.64998mm"
            pcbY="1.65005385mm"
            width="0.999998mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="3.64998mm"
            pcbY="1.65005385mm"
            width="0.999998mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="3.64998mm"
            pcbY="-0.65017015mm"
            width="0.999998mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.64998mm"
            pcbY="-0.65017015mm"
            width="0.999998mm"
            height="0.6999986mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 3.4289491999998063, y: 1.0688002499998674 },
              { x: 3.4289491999998063, y: -0.06891655000003993 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.9188918000000967, y: 1.9799236499998187 },
              { x: 2.9187901999998758, y: 1.9799236499998187 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.6999477999999044, y: 4.4828904499999 },
              { x: 0.6999477999999044, y: 1.9829208500000277 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.7000494000000117, y: 4.4828904499999 },
              { x: -0.7000494000000117, y: 1.9829208500000277 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.7000494000000117, y: 4.4828904499999 },
              { x: 0.6999477999999044, y: 4.4828904499999 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.5560508000000937, y: 1.0688002499998674 },
              { x: -3.5560508000000937, y: -0.06891655000003993 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.773324399999865, y: -0.941076350000003 },
              { x: 2.9187901999998758, y: -0.941076350000003 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.22666960000003655, y: -0.941076350000003 },
              { x: 1.72653959999991, y: -0.941076350000003 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.7266666000001578, y: -0.941076350000003 },
              { x: -1.2734544000001051, y: -0.941076350000003 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.9188918000000967, y: -0.941076350000003 },
              { x: -2.7734514000001127, y: -0.941076350000003 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.002032mm"
            pcbY="5.49434585mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.4008680000000595, y: 4.744345849999945 },
              { x: 4.404931999999917, y: 4.744345849999945 },
              { x: 4.404931999999917, y: -2.232654150000144 },
              { x: -4.4008680000000595, y: -2.232654150000144 },
              { x: -4.4008680000000595, y: 4.744345849999945 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C22435663.obj?uuid=112f91d5fd724485b3714dde26bc4268",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C22435663.step?uuid=112f91d5fd724485b3714dde26bc4268",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: -0.00005080000005364127,
          y: 0.7159106499999326,
          z: -1.4300009999999999,
        },
      }}
      {...props}
    />
  )
}
