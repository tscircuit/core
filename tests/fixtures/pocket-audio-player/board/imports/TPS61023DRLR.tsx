import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["FB"],
  pin2: ["EN"],
  pin3: ["VIN"],
  pin4: ["GND"],
  pin5: ["SW"],
  pin6: ["VOUT"],
} as const

const pinAttributes = {
  pin3: { requiresPower: true },
  pin4: { requiresGround: true },
} as const

export const TPS61023DRLR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C919459"],
      }}
      manufacturerPartNumber="TPS61023DRLR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.7499858mm"
            pcbY="-0.000127mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.7499858mm"
            pcbY="-0.000127mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.7499858mm"
            pcbY="0.499999mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="0.7499858mm"
            pcbY="-0.499999mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.7499858mm"
            pcbY="0.499999mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.7499858mm"
            pcbY="-0.499999mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.4751578000000052, y: -0.7874762000000004 },
              { x: 0.4748021999999992, y: -0.7874762000000004 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.4751578000000052, y: 0.7873237999999958 },
              { x: 0.4748021999999992, y: 0.7873237999999958 },
            ]}
          />
          <silkscreencircle
            pcbX="0.840105mm"
            pcbY="-0.930021mm"
            radius="0.059944mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.016383mm"
            pcbY="1.834517mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.2877170000000007, y: 1.0845170000000053 },
              { x: 1.3204829999999959, y: 1.0845170000000053 },
              { x: 1.3204829999999959, y: -1.2442829999999958 },
              { x: -1.2877170000000007, y: -1.2442829999999958 },
              { x: -1.2877170000000007, y: 1.0845170000000053 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C919459.obj?uuid=ec2270bac0544bf5afe06b24e8356512",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C919459.step?uuid=ec2270bac0544bf5afe06b24e8356512",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: -0.00005079999999679785,
          y: 0.029921200000003978,
          z: 0,
        },
      }}
      {...props}
    />
  )
}
