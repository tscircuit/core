import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["VOUT"],
} as const

export const RT9013_33GB = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C47773"],
      }}
      manufacturerPartNumber="RT9013_33GB"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.9499599999999191mm"
            pcbY="-1.1581701499999326mm"
            width="0.48999139999999997mm"
            height="1.1569954mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-1.1581701499999326mm"
            width="0.48999139999999997mm"
            height="1.1569954mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.9499599999998054mm"
            pcbY="-1.1581701499999326mm"
            width="0.48999139999999997mm"
            height="1.1569954mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.9499599999998054mm"
            pcbY="1.1491658500000312mm"
            width="0.48999139999999997mm"
            height="1.1750040000000002mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.9499599999999191mm"
            pcbY="1.1491658500000312mm"
            width="0.48999139999999997mm"
            height="1.1750040000000002mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.5262098000000606, y: -0.8557069500000125 },
              { x: -1.5262098000000606, y: 0.8467026499999974 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.5262097999998332, y: -0.8557069500000125 },
              { x: 1.5262097999998332, y: 0.8467026499999974 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.4764023999998699, y: 0.8467026499999974 },
              { x: -0.4764023999999836, y: 0.8467026499999974 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=460193f9bf2d42e58cf3c2f675b07dc6&pn=C47773",
        rotationOffset: { x: 0, y: 0, z: 90 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
