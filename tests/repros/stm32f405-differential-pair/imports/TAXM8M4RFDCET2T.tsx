import type { CrystalProps } from "@tscircuit/props"

type ImportedCrystalProps = Omit<CrystalProps, "frequency" | "pinVariant">

export const TAXM8M4RFDCET2T = (props: ImportedCrystalProps) => {
  const { name = "X1", ...restProps } = props

  return (
    <crystal
      name={name}
      frequency="8MHz"
      pinVariant="four_pin"
      supplierPartNumbers={{
        jlcpcb: ["C403948"],
      }}
      manufacturerPartNumber="TAXM8M4RFDCET2T"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.099947mm"
            pcbY="0.799973mm"
            width="1.3999972mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="1.099947mm"
            pcbY="0.799973mm"
            width="1.3999972mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.099947mm"
            pcbY="-0.799973mm"
            width="1.3999972mm"
            height="1.1500104mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.099947mm"
            pcbY="-0.799973mm"
            width="1.3999972mm"
            height="1.1500104mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.540050800000131, y: -1.015873000000056 },
              { x: -2.540050800000131, y: -1.7778730000001133 },
              { x: -2.540050800000131, y: -1.904873000000066 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.029536200000166, y: -1.6786098000000038 },
              { x: -2.286076200000025, y: -1.6786098000000038 },
              { x: -2.286076200000025, y: 1.6512793999999076 },
              { x: 2.285923799999864, y: 1.6512793999999076 },
              { x: 2.285923799999864, y: 0.00027939999995396647 },
              { x: 2.285923799999864, y: -1.6507205999999996 },
              { x: -2.029536200000166, y: -1.6786098000000038 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.540050800000131, y: -1.904873000000066 },
              { x: -1.6510508000002346, y: -1.904873000000066 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.120777mm"
            pcbY="2.640967mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.7837770000001, y: 1.8909669999999323 },
              { x: 2.5422229999999217, y: 1.8909669999999323 },
              { x: 2.5422229999999217, y: -2.165032999999994 },
              { x: -2.7837770000001, y: -2.165032999999994 },
              { x: -2.7837770000001, y: 1.8909669999999323 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C403948.obj?uuid=6fb6f1ac4cf64e11ab7df9c0adbf8c3a",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C403948.step?uuid=6fb6f1ac4cf64e11ab7df9c0adbf8c3a",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.000025400000140507473,
          y: -0.00008889999992334197,
          z: -0.001,
        },
      }}
      {...restProps}
    />
  )
}
