import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OSC1"],
  pin2: ["OSC2"],
} as const

export const ABS07_32_768KHZ_7_T = (props: ChipProps<typeof pinLabels>) => {
  return (
    <crystal
      frequency="32.768kHz"
      loadCapacitance="7pF"
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C276424"],
      }}
      manufacturerPartNumber="ABS07_32_768KHZ_7_T"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.1549888mm"
            pcbY="0mm"
            width="0.850011mm"
            height="1.6999966mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.1549888mm"
            pcbY="0mm"
            width="0.850011mm"
            height="1.6999966mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.028596400000083, y: -1.0786109999999098 },
              { x: -2.028596400000083, y: 1.0786110000000235 },
              { x: 2.0285963999999694, y: 1.0786110000000235 },
              { x: 2.0285963999999694, y: -1.0786109999999098 },
              { x: -2.028596400000083, y: -1.0786109999999098 },
            ]}
          />
          <courtyardoutline
            outline={[
              { x: -2.282000000000039, y: 1.3167999999999438 },
              { x: 2.2819999999999254, y: 1.3167999999999438 },
              { x: 2.2819999999999254, y: -1.3421999999999343 },
              { x: -2.282000000000039, y: -1.3421999999999343 },
              { x: -2.282000000000039, y: 1.3167999999999438 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C276424.obj?uuid=b374b09d4a6d4557b2ff8af51e7e333f",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C276424.step?uuid=b374b09d4a6d4557b2ff8af51e7e333f",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: 0 },
      }}
      {...props}
    />
  )
}
