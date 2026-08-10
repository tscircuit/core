import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDD"],
  pin2: ["CFG2"],
  pin3: ["CFG3"],
  pin4: ["DP"],
  pin5: ["DM"],
  pin6: ["CC2"],
  pin7: ["CC1"],
  pin8: ["VBUS"],
  pin9: ["CFG1"],
  pin10: ["PG"],
  pin11: ["GND"],
} as const

export const CH224K = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={{
        VDD: { requiresPower: true },
        GND: { requiresGround: true },
      }}
      supplierPartNumbers={{
        jlcpcb: ["C970725"],
      }}
      manufacturerPartNumber="CH224K"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin10"]}
            pcbX="-1.999996mm"
            pcbY="2.999867mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-0.999998mm"
            pcbY="3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-0mm"
            pcbY="3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.999998mm"
            pcbY="3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.999996mm"
            pcbY="2.999867mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.999996mm"
            pcbY="-3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.999998mm"
            pcbY="-3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0mm"
            pcbY="-3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.999998mm"
            pcbY="-3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.999996mm"
            pcbY="-3.000121mm"
            width="0.5999988mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-0mm"
            pcbY="0.000127mm"
            width="3.2999934mm"
            height="2.0999958mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.4600916000000552, y: 0.5400039999999535 },
              { x: -2.5000711999999794, y: 0.5800089999999045 },
              { x: -2.5000711999999794, y: 0.8199882000000116 },
              { x: -2.5000711999999794, y: 1.9499580000000378 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5000711999999794, y: -0.48003460000006726 },
              { x: -2.400045999999975, y: -0.48003460000006726 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5000711999999794, y: -1.9500087999999778 },
              { x: -2.5000711999999794, y: -0.48003460000006726 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.499918799999932, y: -1.9500087999999778 },
              { x: 2.499918799999932, y: 1.9499580000000378 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5000711999999794, y: 1.9499580000000378 },
              { x: 2.499918799999932, y: 1.9499580000000378 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5000711999999794, y: -1.9500087999999778 },
              { x: 2.499918799999932, y: -1.9500087999999778 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.9200622000000749, y: 0 },
              { x: -1.948065706108082, y: 0.21401308169981803 },
              { x: -2.063987168701715, y: 0.3960790312980862 },
              { x: -2.2460531183000967, y: 0.5120004938919465 },
              { x: -2.4600662000000284, y: 0.5400039999999535 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.4000714000001153, y: -0.48000920000004044 },
              { x: -2.1600667999999814, y: -0.41570016125035636 },
              { x: -1.984371238749759, y: -0.2400046000001339 },
              { x: -1.9200622000000749, y: 0 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.6357600000000048, y: -1.2602210000000014 },
              { x: -1.645444766097171, y: -1.3337841019132384 },
              { x: -1.6738390635840688, y: -1.4023339999999962 },
              { x: -1.7190078680105216, y: -1.4611991319895878 },
              { x: -1.7778730000001133, y: -1.506367936415927 },
              { x: -1.8464228980867574, y: -1.5347622339028248 },
              { x: -1.9199859999999944, y: -1.5444470000001047 },
              { x: -1.9935491019132314, y: -1.5347622339028248 },
              { x: -2.0620989999999892, y: -1.506367936415927 },
              { x: -2.120964131989581, y: -1.4611991319895878 },
              { x: -2.16613293641592, y: -1.4023339999999962 },
              { x: -2.1945272339030453, y: -1.3337841019132384 },
              { x: -2.2042120000000978, y: -1.2602210000000014 },
              { x: -2.1945272339030453, y: -1.1866578980867644 },
              { x: -2.16613293641592, y: -1.1181080000000065 },
              { x: -2.120964131989581, y: -1.0592428680105286 },
              { x: -2.0620989999999892, y: -1.0140740635840757 },
              { x: -1.9935491019132314, y: -0.9856797660971779 },
              { x: -1.9199859999999944, y: -0.9759950000000117 },
              { x: -1.8464228980867574, y: -0.9856797660971779 },
              { x: -1.7778730000001133, y: -1.0140740635840757 },
              { x: -1.7190078680105216, y: -1.0592428680105286 },
              { x: -1.6738390635840688, y: -1.1181080000000065 },
              { x: -1.645444766097171, y: -1.1866578980867644 },
              { x: -1.6357600000000048, y: -1.2602210000000014 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.006604mm"
            pcbY="4.761613mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.7585040000000163, y: 4.011613000000011 },
              { x: 2.7452959999999393, y: 4.011613000000011 },
              { x: 2.7452959999999393, y: -4.209987000000069 },
              { x: -2.7585040000000163, y: -4.209987000000069 },
              { x: -2.7585040000000163, y: 4.011613000000011 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C970725.obj?uuid=c37139ac11be40009679f32869d9459d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C970725.step?uuid=c37139ac11be40009679f32869d9459d",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000063500000123895, y: 0, z: -0.81 },
      }}
      {...props}
    />
  )
}
