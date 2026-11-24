import type { InductorProps } from "@tscircuit/props"

export const SRP1038A_100M = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="10uH"
      supplierPartNumbers={{
        jlcpcb: ["C780184"],
      }}
      manufacturerPartNumber="SRP1038A-100M"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-4.949952mm"
            pcbY="0mm"
            width="3.499993mm"
            height="3.499993mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="4.949952mm"
            pcbY="0mm"
            width="3.499993mm"
            height="3.499993mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -5.500014400000055, y: 5.000015400000166 },
              { x: 5.500014399999941, y: 4.999990000000025 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.500014400000055, y: -5.000015400000052 },
              { x: 5.500014399999941, y: -4.999989999999912 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.500014400000055, y: -5.000015400000052 },
              { x: -5.500014400000055, y: -2.2811485999999377 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.500014400000055, y: 2.2811486000000514 },
              { x: -5.500014400000055, y: 5.000015400000166 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.500014399999941, y: -4.999989999999912 },
              { x: 5.500014399999941, y: -2.2811485999999377 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.500014399999941, y: 2.2811486000000514 },
              { x: 5.500014399999941, y: 4.999990000000025 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="6.0038mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -6.949948499999891, y: 5.249990000000025 },
              { x: 6.949948499999891, y: 5.249990000000025 },
              { x: 6.949948499999891, y: -5.249989999999912 },
              { x: -6.949948499999891, y: -5.249989999999912 },
              { x: -6.949948499999891, y: 5.249990000000025 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C780184.obj?uuid=ace82c4a2fd2489881d6a760dfc5f25c",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C780184.step?uuid=ace82c4a2fd2489881d6a760dfc5f25c",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.00004999999999988347, z: -0.01 },
      }}
      {...props}
    />
  )
}
