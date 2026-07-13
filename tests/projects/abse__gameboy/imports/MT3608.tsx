import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["SW"],
  pin2: ["GND"],
  pin3: ["FB"],
  pin4: ["EN"],
  pin5: ["IN"],
  pin6: ["NC"],
} as const

export const MT3608 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C84817"],
      }}
      manufacturerPartNumber="MT3608"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.94996mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.94996mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.94996mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.94996mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.5391891999998961, y: -0.8892031999998835 },
              { x: 1.5391891999998961, y: 0.8892031999999972 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5391892000000098, y: -0.8892031999998835 },
              { x: -1.5391892000000098, y: 0.8892031999999972 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.518158000000085, y: -1.3014960000000428 },
              { x: -1.5232730105126393, y: -1.3403483621364103 },
              { x: -1.538269462536391, y: -1.3765529999999444 },
              { x: -1.5621253726490067, y: -1.4076426273509242 },
              { x: -1.5932150000001002, y: -1.4314985374635398 },
              { x: -1.6294196378635206, y: -1.4464949894874053 },
              { x: -1.6682720000001154, y: -1.451609999999846 },
              { x: -1.7071243621367103, y: -1.4464949894874053 },
              { x: -1.7433290000001307, y: -1.4314985374635398 },
              { x: -1.7744186273511104, y: -1.4076426273509242 },
              { x: -1.7982745374637261, y: -1.3765529999999444 },
              { x: -1.8132709894875916, y: -1.3403483621364103 },
              { x: -1.818386000000146, y: -1.3014960000000428 },
              { x: -1.8132709894875916, y: -1.2626436378633343 },
              { x: -1.7982745374637261, y: -1.226438999999914 },
              { x: -1.7744186273511104, y: -1.1953493726489341 },
              { x: -1.7433290000001307, y: -1.1714934625363185 },
              { x: -1.7071243621367103, y: -1.156497010512453 },
              { x: -1.6682720000001154, y: -1.1513819999998987 },
              { x: -1.6294196378635206, y: -1.156497010512453 },
              { x: -1.5932150000001002, y: -1.1714934625363185 },
              { x: -1.5621253726490067, y: -1.1953493726489341 },
              { x: -1.538269462536391, y: -1.226438999999914 },
              { x: -1.5232730105126393, y: -1.2626436378633343 },
              { x: -1.518158000000085, y: -1.3014960000000428 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1524mm"
            pcbY="2.6764mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.078800000000001, y: 1.9264000000000578 },
              { x: 1.7739999999998872, y: 1.9264000000000578 },
              { x: 1.7739999999998872, y: -2.0279999999999063 },
              { x: -2.078800000000001, y: -2.0279999999999063 },
              { x: -2.078800000000001, y: 1.9264000000000578 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C84817.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C84817.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: {
          x: -0.000012700000070253736,
          y: 0.000012700000070253736,
          z: -0.048939,
        },
      }}
      {...props}
    />
  )
}
