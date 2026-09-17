// Exact C70571 JLCPCB-linked supplier library footprint, downloaded 2026-09-11.
// YXC24MHz, specified crystal load18pF; source: JLCPCB C70571 listing.
// Pins1/3=X1/X2, pins2/4=grounded case. No network CAD assets.
import type { CrystalProps } from "@tscircuit/props"

type ImportedCrystalProps = Omit<
  CrystalProps,
  "frequency" | "pinVariant" | "loadCapacitance"
>

export const X322524MRB4SI = (props: ImportedCrystalProps) => {
  const { name = "X1", ...restProps } = props

  return (
    <crystal
      name={name}
      frequency="24MHz"
      loadCapacitance="18pF"
      pinAttributes={{
        pin2: { requiresGround: true },
        pin4: { requiresGround: true },
      }}
      pinVariant="four_pin"
      supplierPartNumbers={{
        jlcpcb: ["C70571"],
      }}
      manufacturerPartNumber="X322524MRB4SI"
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
      {...restProps}
    />
  )
}
