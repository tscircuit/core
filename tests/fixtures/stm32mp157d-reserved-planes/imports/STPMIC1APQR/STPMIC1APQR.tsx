import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["RSTn"],
  pin2: ["WAKEUP"],
  pin3: ["SDA"],
  pin4: ["SCL"],
  pin5: ["VOUT1"],
  pin6: ["PGND1"],
  pin7: ["VLX1"],
  pin8: ["BUCK1IN"],
  pin9: ["VOUT2"],
  pin10: ["PGND2"],
  pin11: ["VLX2"],
  pin12: ["BUCK2IN"],
  pin13: ["LDO3IN"],
  pin14: ["LDO3OUT"],
  pin15: ["GNDLDO"],
  pin16: ["VREFDDR"],
  pin17: ["PONKEYn"],
  pin18: ["LDO2OUT"],
  pin19: ["LDO25IN"],
  pin20: ["LDO5OUT"],
  pin21: ["LDO6OUT"],
  pin22: ["LDO16IN"],
  pin23: ["LDO1OUT"],
  pin24: ["BUCK4IN"],
  pin25: ["VLX4"],
  pin26: ["PGND4"],
  pin27: ["VOUT4"],
  pin28: ["BUCK3IN"],
  pin29: ["VLX3"],
  pin30: ["PGND3"],
  pin31: ["VOUT3"],
  pin32: ["PGBOOST"],
  pin33: ["VLXBST"],
  pin34: ["BOUT"],
  pin35: ["VBUSOTG"],
  pin36: ["VIN"],
  pin37: ["SWIN"],
  pin38: ["SWOUT"],
  pin39: ["LDO4OUT"],
  pin40: ["INTLDO"],
  pin41: ["AGND"],
  pin42: ["VIO"],
  pin43: ["INTn"],
  pin44: ["PWRCTRL"],
  pin45: ["EPGND"],
} as const

const pinAttributes = {
  pin6: { requiresGround: true },
  pin10: { requiresGround: true },
  pin26: { requiresGround: true },
  pin30: { requiresGround: true },
  pin36: { requiresPower: true },
  pin41: { requiresGround: true },
} as const

export const STPMIC1APQR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C2156052"],
      }}
      manufacturerPartNumber="STPMIC1APQR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin45"]}
            pcbX="0mm"
            pcbY="0mm"
            width="3.5999928mm"
            height="4.5999908mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="-1.800098mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="-1.400048mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="-0.999998mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-0.599948mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="-0.199898mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="0.199898mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="0.599948mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="0.999998mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="1.400048mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="1.800098mm"
            pcbY="2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="2.3876mm"
            pcbY="2.199894mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="2.3876mm"
            pcbY="1.800098mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="2.3876mm"
            pcbY="1.400048mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="2.3876mm"
            pcbY="0.999998mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="2.3876mm"
            pcbY="0.599948mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="2.3876mm"
            pcbY="0.199898mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="2.3876mm"
            pcbY="-0.199898mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="2.3876mm"
            pcbY="-0.599948mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="2.3876mm"
            pcbY="-0.999998mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="2.3876mm"
            pcbY="-1.400048mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="2.3876mm"
            pcbY="-1.800098mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="2.3876mm"
            pcbY="-2.199894mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="1.800098mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="1.400048mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="0.999998mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="0.599948mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="0.199898mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-0.199898mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-0.599948mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-0.999998mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-1.400048mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-1.800098mm"
            pcbY="-2.887472mm"
            width="0.2199894mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-2.3876mm"
            pcbY="-2.199894mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-2.3876mm"
            pcbY="-1.800098mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-2.3876mm"
            pcbY="-1.400048mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-2.3876mm"
            pcbY="-0.999998mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-2.3876mm"
            pcbY="-0.599948mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-2.3876mm"
            pcbY="-0.199898mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-2.3876mm"
            pcbY="0.199898mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-2.3876mm"
            pcbY="0.599948mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-2.3876mm"
            pcbY="0.999998mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-2.3876mm"
            pcbY="1.400048mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-2.3876mm"
            pcbY="1.800098mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.3876mm"
            pcbY="2.199894mm"
            width="0.7999984mm"
            height="0.2199894mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.576195000000098, y: 2.4643842000000404 },
              { x: -2.576195000000098, y: 3.0761939999999868 },
              { x: -2.0643850000001294, y: 3.0761939999999868 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5761949999999842, y: 2.4643842000000404 },
              { x: 2.5761949999999842, y: 3.0761939999999868 },
              { x: 2.064384999999902, y: 3.0761939999999868 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5761949999999842, y: -2.4643842000000404 },
              { x: 2.5761949999999842, y: -3.0761939999999868 },
              { x: 2.064384999999902, y: -3.0761939999999868 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.576195000000098, y: -2.4643842000000404 },
              { x: -2.576195000000098, y: -3.0761939999999868 },
              { x: -2.0643850000001294, y: -3.0761939999999868 },
            ]}
          />
          <silkscreencircle
            pcbX="-3.302mm"
            pcbY="2.159mm"
            radius="0.094742mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.3126486mm"
            pcbY="4.2819594mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.6487485999999762, y: 3.531959400000119 },
              { x: 3.023451399999999, y: 3.531959400000119 },
              { x: 3.023451399999999, y: -3.5466405999999324 },
              { x: -3.6487485999999762, y: -3.5466405999999324 },
              { x: -3.6487485999999762, y: 3.531959400000119 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
