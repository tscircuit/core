import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDD"],
  pin2: ["CC1"],
  pin3: ["CC2"],
  pin4: ["SCL"],
  pin5: ["SDA"],
  pin6: ["GND"],
  pin7: ["SEL_PDO3"],
  pin8: ["SEL_PDO2"],
  pin9: ["ADDR0"],
  pin10: ["SEL_PDO4"],
  pin11: ["SEL_PDO5"],
  pin12: ["VBUS_SENSE"],
  pin13: ["VBUS_DISCH"],
  pin14: ["VBUS_EN_SRC"],
  pin15: ["VREG_1V2"],
  pin16: ["VREG_2V7"],
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin6: { requiresGround: true },
} as const

export const STUSB4710AQ1TR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C2678060"],
      }}
      manufacturerPartNumber="STUSB4710AQ1TR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            points={[
              { x: "-1.800098mm", y: "0.8900668mm" },
              { x: "-1.1756136mm", y: "0.8900668mm" },
              { x: "-0.975106mm", y: "0.6100572mm" },
              { x: "-1.800098mm", y: "0.6100572mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.387602mm"
            pcbY="0.249936mm"
            width="0.824992mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.387602mm"
            pcbY="-0.249936mm"
            width="0.824992mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            points={[
              { x: "-1.800098mm", y: "-0.6100572mm" },
              { x: "-0.975106mm", y: "-0.6100572mm" },
              { x: "-1.1756136mm", y: "-0.8900668mm" },
              { x: "-1.800098mm", y: "-0.8900668mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin5"]}
            points={[
              { x: "-0.8900668mm", y: "-1.1756136mm" },
              { x: "-0.6100572mm", y: "-0.975106mm" },
              { x: "-0.6100572mm", y: "-1.800098mm" },
              { x: "-0.8900668mm", y: "-1.800098mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.249936mm"
            pcbY="-1.387602mm"
            width="0.2800096mm"
            height="0.824992mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.249936mm"
            pcbY="-1.387602mm"
            width="0.2800096mm"
            height="0.824992mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            points={[
              { x: "0.6100572mm", y: "-0.975106mm" },
              { x: "0.8900668mm", y: "-1.1756136mm" },
              { x: "0.8900668mm", y: "-1.800098mm" },
              { x: "0.6100572mm", y: "-1.800098mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin9"]}
            points={[
              { x: "0.975106mm", y: "-0.6100572mm" },
              { x: "1.800098mm", y: "-0.6100572mm" },
              { x: "1.800098mm", y: "-0.8900668mm" },
              { x: "1.1756136mm", y: "-0.8900668mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.387602mm"
            pcbY="-0.249936mm"
            width="0.824992mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.387602mm"
            pcbY="0.249936mm"
            width="0.824992mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            points={[
              { x: "1.1756136mm", y: "0.8900668mm" },
              { x: "1.800098mm", y: "0.8900668mm" },
              { x: "1.800098mm", y: "0.6100572mm" },
              { x: "0.975106mm", y: "0.6100572mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin13"]}
            points={[
              { x: "0.6100572mm", y: "1.800098mm" },
              { x: "0.8900668mm", y: "1.800098mm" },
              { x: "0.8900668mm", y: "1.1756136mm" },
              { x: "0.6100572mm", y: "0.975106mm" },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="0.249936mm"
            pcbY="1.387602mm"
            width="0.2800096mm"
            height="0.824992mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-0.249936mm"
            pcbY="1.387602mm"
            width="0.2800096mm"
            height="0.824992mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            points={[
              { x: "-0.8900668mm", y: "1.800098mm" },
              { x: "-0.6100572mm", y: "1.800098mm" },
              { x: "-0.6100572mm", y: "0.975106mm" },
              { x: "-0.8900668mm", y: "1.1756136mm" },
            ]}
            shape="polygon"
          />
          <silkscreenpath
            route={[
              { x: -1.5761969999999934, y: 1.0423905999999903 },
              { x: -1.5761969999999934, y: 1.5761969999999792 },
              { x: -1.0423906000000045, y: 1.5761969999999792 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.5761969999999792, y: 1.0423905999999903 },
              { x: 1.5761969999999792, y: 1.5761969999999792 },
              { x: 1.0423906000000045, y: 1.5761969999999792 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.5761969999999792, y: -1.0423906000000187 },
              { x: 1.5761969999999792, y: -1.5761970000000076 },
              { x: 1.0423906000000045, y: -1.5761970000000076 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5761969999999934, y: -1.0423906000000187 },
              { x: -1.5761969999999934, y: -1.5761970000000076 },
              { x: -1.0423906000000045, y: -1.5761970000000076 },
            ]}
          />
          <silkscreencircle pcbX="-2.032mm" pcbY="1.27mm" radius="0.100076mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1651mm"
            pcbY="2.8034mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.0500980000000055, y: 2.0500980000000055 },
              { x: 2.0500980000000055, y: 2.0500980000000055 },
              { x: 2.0500980000000055, y: -2.0500980000000197 },
              { x: -2.0500980000000055, y: -2.0500980000000197 },
              { x: -2.0500980000000055, y: 2.0500980000000055 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2678060.obj?uuid=b2e7be17ad874915af5c0ff710d12fa4",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2678060.step?uuid=b2e7be17ad874915af5c0ff710d12fa4",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.01 },
      }}
      {...props}
    />
  )
}
