import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode", "neg"],
  pin2: ["anode", "pos"],
} as const

export const BZT52C5V1 = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2117"],
      }}
      manufacturerPartNumber="BZT52C5V1"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2", "anode", "pos"]}
            pcbX="1.692402mm"
            pcbY="0mm"
            width="0.9500108mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1", "cathode", "neg"]}
            pcbX="-1.692402mm"
            pcbY="0mm"
            width="0.9500108mm"
            height="1.1500104mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.5800070000000233, y: -0.7551419999998643 },
              { x: -1.4061693999999534, y: -0.7551419999998643 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5800070000000233, y: 0.755141999999978 },
              { x: -1.4061693999999534, y: 0.755141999999978 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5800070000000233, y: 0.755141999999978 },
              { x: -1.5800070000000233, y: 0.8661908000000267 },
              { x: -1.4061693999999534, y: 0.8661908000000267 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4061693999999534, y: -0.866190799999913 },
              { x: -1.5800070000000233, y: -0.866190799999913 },
              { x: -1.5800070000000233, y: -0.7551419999998643 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4061693999999534, y: -0.7551419999998643 },
              { x: -1.4061693999999534, y: -0.866190799999913 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4061693999999534, y: 0.8661908000000267 },
              { x: -1.4061693999999534, y: 0.755141999999978 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8271256000000449, y: 0.8661908000000267 },
              { x: -0.8271256000000449, y: -0.866190799999913 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9700006000000485, y: 0.8661908000000267 },
              { x: -0.9700006000000485, y: -0.866190799999913 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4061693999999534, y: 0.8661908000000267 },
              { x: 1.4061693999999534, y: 0.8661908000000267 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.4061693999999534, y: 0.8661908000000267 },
              { x: 1.4061693999999534, y: 0.6981951999998728 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4061693999999534, y: -0.866190799999913 },
              { x: 1.4061693999999534, y: -0.866190799999913 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.4061693999999534, y: -0.866190799999913 },
              { x: 1.4061693999999534, y: -0.6981951999999865 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0127mm"
            pcbY="1.889mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -2.030196600000181, y: 0.09479280000005019 },
              { x: -2.030196600000181, y: -0.0947927999999365 },
              { x: -1.2717780000000403, y: -0.0947927999999365 },
              { x: -1.2717780000000403, y: 0.09479280000005019 },
              { x: -2.030196600000181, y: 0.09479280000005019 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: 1.9354038000000173, y: 0.0977900000000318 },
              { x: 1.9354038000000173, y: -0.0917955999999549 },
              { x: 1.17698519999999, y: -0.0917955999999549 },
              { x: 1.17698519999999, y: 0.0977900000000318 },
              { x: 1.9354038000000173, y: 0.0977900000000318 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: 1.6509999999999536, y: 0.6349999999999909 },
              { x: 1.6509999999999536, y: -0.629005599999914 },
              { x: 1.4613889999998264, y: -0.629005599999914 },
              { x: 1.4613889999998264, y: 0.6349999999999909 },
              { x: 1.6509999999999536, y: 0.6349999999999909 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -2.417407400000002, y: 1.0499984000000495 },
              { x: 2.417407399999888, y: 1.0499984000000495 },
              { x: 2.417407399999888, y: -1.0499984000000495 },
              { x: -2.417407400000002, y: -1.0499984000000495 },
              { x: -2.417407400000002, y: 1.0499984000000495 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2117.obj?uuid=ffe28a36cfa04cde86eca0e275be7a76",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2117.step?uuid=ffe28a36cfa04cde86eca0e275be7a76",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.55 },
      }}
      {...restProps}
    />
  )
}
