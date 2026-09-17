import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["STAT"],
  pin2: ["VSS"],
  pin3: ["VBAT"],
  pin4: ["VDD"],
  pin5: ["PROG"],
} as const

export const MCP73831T_2ACI_OT = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C424093"],
      }}
      manufacturerPartNumber="MCP73831T_2ACI_OT"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.94996mm"
            pcbY="-1.15817015mm"
            width="0.4899914mm"
            height="1.1569954mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-1.15817015mm"
            width="0.4899914mm"
            height="1.1569954mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.94996mm"
            pcbY="-1.15817015mm"
            width="0.4899914mm"
            height="1.1569954mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.94996mm"
            pcbY="1.14916585mm"
            width="0.4899914mm"
            height="1.175004mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.94996mm"
            pcbY="1.14916585mm"
            width="0.4899914mm"
            height="1.175004mm"
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
          <silkscreenpath
            route={[
              { x: -1.5008860000000368, y: -1.1475021500000366 },
              { x: -1.5060010105125912, y: -1.1863545121365178 },
              { x: -1.520997462536343, y: -1.2225591500000519 },
              { x: -1.5448533726489586, y: -1.253648777350918 },
              { x: -1.575943000000052, y: -1.277504687463761 },
              { x: -1.6121476378634725, y: -1.2925011394875128 },
              { x: -1.6510000000000673, y: -1.2976161499999534 },
              { x: -1.6898523621366621, y: -1.2925011394875128 },
              { x: -1.7260570000000826, y: -1.277504687463761 },
              { x: -1.7571466273510623, y: -1.253648777350918 },
              { x: -1.781002537463678, y: -1.2225591500000519 },
              { x: -1.7959989894875434, y: -1.1863545121365178 },
              { x: -1.8011140000000978, y: -1.1475021500000366 },
              { x: -1.7959989894875434, y: -1.1086497878634418 },
              { x: -1.781002537463678, y: -1.0724451499999077 },
              { x: -1.7571466273510623, y: -1.041355522648928 },
              { x: -1.7260570000000826, y: -1.0174996125363123 },
              { x: -1.6898523621366621, y: -1.0025031605124468 },
              { x: -1.6510000000000673, y: -0.9973881500000061 },
              { x: -1.6121476378634725, y: -1.0025031605124468 },
              { x: -1.575943000000052, y: -1.0174996125363123 },
              { x: -1.5448533726489586, y: -1.041355522648928 },
              { x: -1.520997462536343, y: -1.0724451499999077 },
              { x: -1.5060010105125912, y: -1.1086497878634418 },
              { x: -1.5008860000000368, y: -1.1475021500000366 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1397mm"
            pcbY="2.74809785mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.0534000000000106, y: 1.998097850000022 },
              { x: 1.7739999999998872, y: 1.998097850000022 },
              { x: 1.7739999999998872, y: -2.108702149999999 },
              { x: -2.0534000000000106, y: -2.108702149999999 },
              { x: -2.0534000000000106, y: 1.998097850000022 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C424093.obj?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C424093.step?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        pcbRotationOffset: 90,
        modelOriginPosition: {
          x: 0.004489450000050965,
          y: 0.000012700000070253736,
          z: -0.049083,
        },
      }}
      {...props}
    />
  )
}
