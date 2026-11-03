import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CPVDD"],
  pin2: ["CAPP"],
  pin3: ["CPGND"],
  pin4: ["CAPM"],
  pin5: ["VNEG"],
  pin6: ["OUTL"],
  pin7: ["OUTR"],
  pin8: ["AVDD"],
  pin9: ["AGND"],
  pin10: ["DEMP"],
  pin11: ["FLT"],
  pin12: ["SCK"],
  pin13: ["BCK"],
  pin14: ["DIN"],
  pin15: ["LRCK"],
  pin16: ["FMT"],
  pin17: ["XSMT"],
  pin18: ["LDOO"],
  pin19: ["DGND"],
  pin20: ["DVDD"],
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin8: { requiresPower: true },
  pin20: { requiresPower: true },

  pin9: { requiresGround: true },
} as const

export const PCM5102APWR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C107671"],
      }}
      manufacturerPartNumber="PCM5102APWR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.925064mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-2.275078mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.625092mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.975106mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.324866mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.32512mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.975106mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.625092mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="2.275078mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="2.925064mm"
            pcbY="-2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-2.925064mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-2.275078mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-1.625092mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-0.975106mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-0.324866mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="0.32512mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="0.975106mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="1.625092mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="2.275078mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="2.925064mm"
            pcbY="2.870962mm"
            width="0.3640074mm"
            height="1.7420082mm"
            radius="0.1820037mm"
            shape="pill"
          />
          <silkscreenpath
            route={[
              { x: -3.326206200000115, y: -1.7713960000000952 },
              { x: -3.326206200000115, y: 1.7713959999999815 },
              { x: 3.3262061999998878, y: 1.7713959999999815 },
              { x: 3.3262061999998878, y: -1.7713960000000952 },
              { x: -3.326206200000115, y: -1.7713960000000952 },
            ]}
          />
          <silkscreencircle
            pcbX="-2.925064mm"
            pcbY="-1.019048mm"
            radius="0.150114mm"
          />
          <silkscreencircle
            pcbX="-3.559302mm"
            pcbY="-2.870962mm"
            radius="0.150114mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1905mm"
            pcbY="4.556mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.958400000000097, y: 3.80600000000004 },
              { x: 3.5773999999998978, y: 3.80600000000004 },
              { x: 3.5773999999998978, y: -4.009199999999964 },
              { x: -3.958400000000097, y: -4.009199999999964 },
              { x: -3.958400000000097, y: 3.80600000000004 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C107671.obj?uuid=f8ba5b4174b9490d8c445fbe2ed40b80",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C107671.step?uuid=f8ba5b4174b9490d8c445fbe2ed40b80",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0.000012700000070253736, z: -0.019205 },
      }}
      {...props}
    />
  )
}
