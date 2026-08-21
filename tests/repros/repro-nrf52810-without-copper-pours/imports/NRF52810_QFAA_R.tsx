import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

const pinLabels = {
  pin1: ["DEC1"],
  pin2: ["P0_00", "XL1"],
  pin3: ["P0_01", "XL2"],
  pin4: ["P0_02", "AIN0"],
  pin5: ["P0_03", "AIN1"],
  pin6: ["P0_04", "AIN2"],
  pin7: ["P0_05", "AIN3"],
  pin8: ["P0_06"],
  pin9: ["P0_07"],
  pin10: ["P0_08"],
  pin11: ["P0_09"],
  pin12: ["P0_10"],
  pin13: ["VDD1"],
  pin14: ["P0_11"],
  pin15: ["P0_12"],
  pin16: ["P0_13"],
  pin17: ["P0_14"],
  pin18: ["P0_15"],
  pin19: ["P0_16"],
  pin20: ["P0_17"],
  pin21: ["P0_18"],
  pin22: ["P0_19"],
  pin23: ["P0_20"],
  pin24: ["P0_21", "nRESET"],
  pin25: ["SWDCLK"],
  pin26: ["SWDIO"],
  pin27: ["P0_22"],
  pin28: ["P0_23"],
  pin29: ["P0_24"],
  pin30: ["ANT"],
  pin31: ["VSS2"],
  pin32: ["DEC2"],
  pin33: ["DEC3"],
  pin34: ["XC1"],
  pin35: ["XC2"],
  pin36: ["VDD3"],
  pin37: ["P0_25"],
  pin38: ["P0_26"],
  pin39: ["P0_27"],
  pin40: ["P0_28", "AIN4"],
  pin41: ["P0_29", "AIN5"],
  pin42: ["P0_30", "AIN6"],
  pin43: ["P0_31", "AIN7"],
  pin44: ["NC"],
  pin45: ["VSS1"],
  pin46: ["DEC4"],
  pin47: ["DCC"],
  pin48: ["VDD2"],
  pin49: ["EP"],
} as const

export const NRF52810_QFAA_R = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C141828"],
      }}
      manufacturerPartNumber="NRF52810_QFAA_R"
      footprint={
        <footprint>
          {Array.from({ length: 12 }, (_, index) => (
            <Fragment key={`left-${index}`}>
              <smtpad
                portHints={[`pin${index + 1}`]}
                pcbX={-3.0}
                pcbY={2.2 - index * 0.4}
                width="0.95mm"
                height="0.2mm"
                shape="rect"
              />
            </Fragment>
          ))}
          {Array.from({ length: 12 }, (_, index) => (
            <Fragment key={`bottom-${index}`}>
              <smtpad
                portHints={[`pin${index + 13}`]}
                pcbX={-2.2 + index * 0.4}
                pcbY={-3.0}
                width="0.2mm"
                height="0.95mm"
                shape="rect"
              />
            </Fragment>
          ))}
          {Array.from({ length: 12 }, (_, index) => (
            <Fragment key={`right-${index}`}>
              <smtpad
                portHints={[`pin${index + 25}`]}
                pcbX={3.0}
                pcbY={-2.2 + index * 0.4}
                width="0.95mm"
                height="0.2mm"
                shape="rect"
              />
            </Fragment>
          ))}
          {Array.from({ length: 12 }, (_, index) => (
            <Fragment key={`top-${index}`}>
              <smtpad
                portHints={[`pin${index + 37}`]}
                pcbX={2.2 - index * 0.4}
                pcbY={3.0}
                width="0.2mm"
                height="0.95mm"
                shape="rect"
              />
            </Fragment>
          ))}
          <smtpad
            portHints={["pin49", "thermalpad"]}
            pcbX={0}
            pcbY={0}
            width="4.6mm"
            height="4.6mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -3.35, y: -3.35 },
              { x: -3.35, y: 3.35 },
              { x: 3.35, y: 3.35 },
              { x: 3.35, y: -3.35 },
              { x: -3.35, y: -3.35 },
            ]}
          />
          <silkscreencircle pcbX={-3.7} pcbY={3.7} radius="0.25mm" />
          <courtyardoutline
            outline={[
              { x: -3.6, y: -3.6 },
              { x: 3.6, y: -3.6 },
              { x: 3.6, y: 3.6 },
              { x: -3.6, y: 3.6 },
              { x: -3.6, y: -3.6 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C141828.obj?uuid=46b18d34784345cd8b1ca45b59e906cb",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C141828.step?uuid=46b18d34784345cd8b1ca45b59e906cb",
        pcbRotationOffset: 270,
        modelOriginPosition: {
          x: -0.00005079999993995443,
          y: -0.00005079999993995443,
          z: 0,
        },
      }}
      {...props}
    />
  )
}
