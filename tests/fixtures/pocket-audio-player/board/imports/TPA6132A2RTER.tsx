import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["INL_NEG"],
  pin2: ["INL_POS"],
  pin3: ["INR_POS"],
  pin4: ["INR_NEG"],
  pin5: ["OUTR"],
  pin6: ["G0"],
  pin7: ["G1"],
  pin8: ["HPVSS"],
  pin9: ["CPN"],
  pin10: ["PGND"],
  pin11: ["CPP"],
  pin12: ["HPVDD"],
  pin13: ["EN"],
  pin14: ["VDD"],
  pin15: ["SGND"],
  pin16: ["OUTL"],
  pin17: ["EP"],
} as const

const pinAttributes = {
  pin10: { requiresGround: true },
  pin14: { requiresPower: true },
} as const

export const TPA6132A2RTER = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C69901"],
      }}
      manufacturerPartNumber="TPA6132A2RTER"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.499997mm"
            pcbY="0.749173mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.499997mm"
            pcbY="0.248793mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.499997mm"
            pcbY="-0.249047mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.499997mm"
            pcbY="-0.749427mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.749173mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.248793mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.249047mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.749427mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.499997mm"
            pcbY="-0.749427mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.499997mm"
            pcbY="-0.249047mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.499997mm"
            pcbY="0.248793mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="1.499997mm"
            pcbY="0.749173mm"
            width="0.7999984mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="0.749427mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="0.249047mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-0.248793mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-0.749173mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="0.000127mm"
            pcbY="-0.000127mm"
            width="1.5999968mm"
            height="1.5999968mm"
            solderPasteMargin={-0.0625}
            shape="rect"
          />
          <platedhole
            shape="circle"
            pcbX={0.000127}
            pcbY={-0.000127}
            holeDiameter={0.3}
            outerDiameter={0.6}
            portHints={["pin17"]}
            coveredWithSolderMask
          />
          <silkscreenpath
            route={[
              { x: -1.2750291999999988, y: -1.7249648000000022 },
              { x: -1.7248631999999944, y: -1.7249648000000022 },
              { x: -1.7248631999999944, y: -1.2751307999999995 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.7248631999999944, y: 1.2750292000000059 },
              { x: -1.7248631999999944, y: 1.7248632000000015 },
              { x: -1.2750291999999988, y: 1.7248632000000015 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2751307999999995, y: 1.7248632000000015 },
              { x: 1.7249648000000093, y: 1.7248632000000015 },
              { x: 1.7249648000000093, y: 1.2750292000000059 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2751307999999995, y: -1.7249648000000022 },
              { x: 1.7249648000000093, y: -1.7249648000000022 },
              { x: 1.7249648000000093, y: -1.2751307999999995 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0751291999999992, y: 1.523949199999997 },
              { x: -2.2257712297039305, y: 1.672690255997658 },
              { x: -2.3751486240147415, y: 1.522679199999999 },
              { x: -2.2257712297039305, y: 1.3726681440023398 },
              { x: -2.0751291999999992, y: 1.5214092000000008 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.243713mm"
            pcbY="2.894713mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.627313000000001, y: 2.144713000000003 },
              { x: 2.1398870000000016, y: 2.144713000000003 },
              { x: 2.1398870000000016, y: -2.1652869999999993 },
              { x: -2.627313000000001, y: -2.1652869999999993 },
              { x: -2.627313000000001, y: 2.144713000000003 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C69901.obj?uuid=15670b08c1a4478b80e58259b300f053",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C69901.step?uuid=15670b08c1a4478b80e58259b300f053",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.02 },
      }}
      {...props}
    />
  )
}
