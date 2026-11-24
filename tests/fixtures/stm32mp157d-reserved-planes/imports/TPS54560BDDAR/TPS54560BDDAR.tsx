import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["BOOT"],
  pin2: ["VIN"],
  pin3: ["EN"],
  pin4: ["RT", "CLK"],
  pin5: ["FB"],
  pin6: ["COMP"],
  pin7: ["GND"],
  pin8: ["SW"],
  pin9: ["EP"],
} as const

const pinAttributes = {
  pin2: { requiresPower: true },
  pin7: { requiresGround: true },
} as const

export const TPS54560BDDAR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C1850354"],
      }}
      manufacturerPartNumber="TPS54560BDDAR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin9"]}
            pcbX="0mm"
            pcbY="0mm"
            width="3.1999936mm"
            height="2.499995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="1.905mm"
            pcbY="-2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.635mm"
            pcbY="-2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.635mm"
            pcbY="-2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.905mm"
            pcbY="2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.635mm"
            pcbY="2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.635mm"
            pcbY="2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.905mm"
            pcbY="-2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-1.905mm"
            pcbY="2.999994mm"
            width="0.5999988mm"
            height="1.5999968mm"
            radius="0.2999994mm"
            shape="pill"
          />
          <silkscreenpath
            route={[
              { x: -2.4999188000001595, y: 1.999919800000157 },
              { x: -2.4999188000001595, y: 0.4499101999999766 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5000711999998657, y: 1.999919800000157 },
              { x: 2.5000711999998657, y: -2.000072199999977 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4999188000001595, y: 1.999919800000157 },
              { x: 2.5000711999998657, y: 1.999919800000157 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4999188000001595, y: -2.000072199999977 },
              { x: 2.5000711999998657, y: -2.000072199999977 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4999188000001595, y: -2.000072199999977 },
              { x: -2.4999188000001595, y: -0.3750817999999754 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4999188000001595, y: 0.4499101999999766 },
              { x: -2.4992838000000575, y: -0.3759962000000314 },
            ]}
          />
          <silkscreencircle
            pcbX="-2.122678mm"
            pcbY="-1.47955mm"
            radius="0.175006mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0254mm"
            pcbY="4.5052mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.7000077999999803, y: 4.049992400000065 },
              { x: 2.69998239999984, y: 4.049992400000065 },
              { x: 2.69998239999984, y: -4.049992400000065 },
              { x: -2.7000077999999803, y: -4.049992400000065 },
              { x: -2.7000077999999803, y: 4.049992400000065 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C1850354.obj?uuid=8a93c3c8e269400f8c283f37d8055e89",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C1850354.step?uuid=8a93c3c8e269400f8c283f37d8055e89",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: -0.91 },
      }}
      {...props}
    />
  )
}
