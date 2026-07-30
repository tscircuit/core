import type { SwitchProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
} as const

export const K3_1280S_F1 = (props: SwitchProps) => {
  const { name = "SW1", ...restProps } = props

  return (
    <switch
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{ jlcpcb: ["C92658"] }}
      manufacturerPartNumber="K3_1280S_F1"
      footprint={
        <footprint>
          <hole pcbX="2.09056605mm" pcbY="3.400044mm" diameter="0.9000236mm" />
          <hole pcbX="2.09056605mm" pcbY="-3.400044mm" diameter="0.9000236mm" />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.31557395mm"
            pcbY="2.499868mm"
            width="2.4500078mm"
            height="1.1999976mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.31557395mm"
            pcbY="0mm"
            width="2.4500078mm"
            height="1.1999976mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.31557395mm"
            pcbY="-2.499868mm"
            width="2.4500078mm"
            height="1.1999976mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 6.839400850000061, y: 1.7499837999999954 },
              { x: 6.839400850000061, y: 0.24998679999998785 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 6.839400850000061, y: 0.24998679999998785 },
              { x: 3.8139306499999748, y: 0.24998679999998785 },
              { x: 3.8139306499999748, y: 0.22948900000005779 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 6.839400850000061, y: 1.7499837999999954 },
              { x: 3.8139306499999748, y: 1.7499837999999954 },
              { x: 3.8139306499999748, y: 1.7391380000000254 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.8139306499999748, y: -4.549978200000055 },
              { x: 0.3139376500000708, y: -4.549978200000055 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.8139306499999748, y: 4.549978200000169 },
              { x: 3.8139306499999748, y: -4.549978200000055 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.3139376500000708, y: 4.549978200000169 },
              { x: 3.8139306499999748, y: 4.549978200000169 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.3139376500000708, y: 4.549978200000169 },
              { x: 0.3139376500000708, y: 3.3339023999999426 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.3139376500000708, y: 1.7460976000000983 },
              { x: 0.3139376500000708, y: 0.793902399999979 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.3139376500000708, y: -0.793902399999979 },
              { x: 0.3139376500000708, y: -1.7460975999999846 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.3139376500000708, y: -3.3339023999999426 },
              { x: 0.3139376500000708, y: -4.549978200000055 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="2.15279605mm"
            pcbY="5.572mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.783503949999954, y: 4.822000000000003 },
              { x: 7.08909605000008, y: 4.822000000000003 },
              { x: 7.08909605000008, y: -4.7965999999998985 },
              { x: -2.783503949999954, y: -4.7965999999998985 },
              { x: -2.783503949999954, y: 4.822000000000003 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C92658.obj?uuid=ba464178ae33423b83adb82f1ac4f72a",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C92658.step?uuid=ba464178ae33423b83adb82f1ac4f72a",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -2.0638960500000394,
          y: 0,
          z: -0.9000012000000001,
        },
      }}
      {...restProps}
    />
  )
}
