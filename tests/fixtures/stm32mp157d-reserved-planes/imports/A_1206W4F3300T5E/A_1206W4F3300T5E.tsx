import type { ResistorProps } from "@tscircuit/props"

export const A_1206W4F3300T5E = (props: Omit<ResistorProps, "resistance">) => {
  const { name = "R1", ...restProps } = props

  return (
    <resistor
      name={name}
      resistance="330ohm"
      supplierPartNumbers={{
        jlcpcb: ["C17930"],
      }}
      manufacturerPartNumber="1206W4F3300T5E"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="1.478788mm"
            pcbY="0mm"
            width="1.207516mm"
            height="1.7010126mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.478788mm"
            pcbY="0mm"
            width="1.207516mm"
            height="1.7010126mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.9512045999999827, y: -1.0790935999999647 },
              { x: 2.311120599999981, y: -1.0790935999999647 },
              { x: 2.311120599999981, y: 1.0790936000000784 },
              { x: 0.9512045999999827, y: 1.0790936000000784 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9512046000000964, y: -1.0790935999999647 },
              { x: -2.311120600000095, y: -1.0790935999999647 },
              { x: -2.311120600000095, y: 1.0790936000000784 },
              { x: -0.9512046000000964, y: 1.0790936000000784 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="2.0668mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.332546000000093, y: 1.1005063000000064 },
              { x: 2.3325459999999794, y: 1.1005063000000064 },
              { x: 2.3325459999999794, y: -1.1005063000000064 },
              { x: -2.332546000000093, y: -1.1005063000000064 },
              { x: -2.332546000000093, y: 1.1005063000000064 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C17930.obj?uuid=da5f078ee43c429f91838a456f48f0a8",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C17930.step?uuid=da5f078ee43c429f91838a456f48f0a8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...restProps}
    />
  )
}
