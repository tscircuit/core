import type { MosfetProps } from "@tscircuit/props"

type AO3401AProps = Omit<MosfetProps, "channelType" | "mosfetMode">

export const AO3401A = (props: AO3401AProps) => {
  return (
    <mosfet
      channelType="p"
      mosfetMode="enhancement"
      supplierPartNumbers={{
        jlcpcb: ["C347476"],
      }}
      manufacturerPartNumber="AO3401A"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2", "source"]}
            pcbX="1.149985mm"
            pcbY="0.94996mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1", "drain"]}
            pcbX="-1.149985mm"
            pcbY="0mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "gate"]}
            pcbX="1.149985mm"
            pcbY="-0.94996mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: 0.6359398000000027 },
              { x: -0.6999731999999881, y: 1.4999461999999966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: 1.4999461999999966 },
              { x: 0.30005020000000115, y: 1.4999461999999966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.7000239999999991, y: -0.31402020000000164 },
              { x: 0.7000239999999991, y: 0.31391859999999383 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: -1.5000478000000044 },
              { x: -0.6999731999999881, y: -0.6360414000000105 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: -1.5000478000000044 },
              { x: 0.30005020000000115, y: -1.5000478000000044 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.133223mm"
            pcbY="2.49606mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.8947769999999906, y: 1.74606 },
              { x: 2.161223000000021, y: 1.74606 },
              { x: 2.161223000000021, y: -1.7511400000000066 },
              { x: -1.8947769999999906, y: -1.7511400000000066 },
              { x: -1.8947769999999906, y: 1.74606 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
