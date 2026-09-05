import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["SDx"],
  pin3: ["SCx"],
  pin4: ["INT1"],
  pin5: ["VDDIO"],
  pin6: ["GND1"],
  pin7: ["GND2"],
  pin8: ["VDD"],
  pin9: ["INT2"],
  pin10: ["NC1"],
  pin11: ["NC2"],
  pin12: ["CS"],
  pin13: ["SCL"],
  pin14: ["SDA"],
} as const

const pinAttributes = {
  pin6: { requiresGround: true },
  pin7: { requiresGround: true },
  pin8: { requiresPower: true },
  pin10: { doNotConnect: true },
  pin11: { doNotConnect: true },
} as const

export const LSM6DS3TR_C = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C967633"],
      }}
      manufacturerPartNumber="LSM6DS3TR-C"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.261999mm"
            pcbY="0.750062mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.261999mm"
            pcbY="0.249936mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.261999mm"
            pcbY="-0.249936mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.261999mm"
            pcbY="-0.750062mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.499999mm"
            pcbY="-1.012444mm"
            width="0.2800096mm"
            height="0.675005mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.000127mm"
            pcbY="-1.012444mm"
            width="0.2800096mm"
            height="0.675005mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.499999mm"
            pcbY="-1.012444mm"
            width="0.2800096mm"
            height="0.675005mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.261999mm"
            pcbY="-0.750062mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.261999mm"
            pcbY="-0.249936mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.261999mm"
            pcbY="0.249936mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.261999mm"
            pcbY="0.750062mm"
            width="0.675005mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="0.499999mm"
            pcbY="1.012444mm"
            width="0.2800096mm"
            height="0.675005mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-0.000127mm"
            pcbY="1.012444mm"
            width="0.2800096mm"
            height="0.675005mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-0.499999mm"
            pcbY="1.012444mm"
            width="0.2800096mm"
            height="0.675005mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.8303767999999536, y: 1.326210200000105 },
              { x: 1.576069999999845, y: 1.326210200000105 },
              { x: 1.576069999999845, y: 1.0804906000000756 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8303767999999536, y: -1.326210200000105 },
              { x: 1.576069999999845, y: -1.326210200000105 },
              { x: 1.576069999999845, y: -1.0804906000000756 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8306307999999945, y: 1.326210200000105 },
              { x: -1.5763240000001133, y: 1.326210200000105 },
              { x: -1.5763240000001133, y: 1.0804906000000756 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8306307999999945, y: -1.326210200000105 },
              { x: -1.5763240000001133, y: -1.326210200000105 },
              { x: -1.5763240000001133, y: -1.0804906000000756 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.905127mm"
            pcbY="0.762mm"
            radius="0.07493mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.190627mm"
            pcbY="2.3462mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.2313270000000784, y: 1.5962000000000671 },
              { x: 1.8500729999998384, y: 1.5962000000000671 },
              { x: 1.8500729999998384, y: -1.5961999999998397 },
              { x: -2.2313270000000784, y: -1.5961999999998397 },
              { x: -2.2313270000000784, y: 1.5962000000000671 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C967633.obj?uuid=f43373e142124ec98babb70d58d97864",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C967633.step?uuid=f43373e142124ec98babb70d58d97864",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.00012700000002041634,
          y: -0.000012700000070253736,
          z: 0,
        },
      }}
      {...props}
    />
  )
}
