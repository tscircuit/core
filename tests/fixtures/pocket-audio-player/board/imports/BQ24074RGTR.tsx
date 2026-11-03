import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["TS"],
  pin2: ["BAT1"],
  pin3: ["BAT2"],
  pin4: ["N_CE"],
  pin5: ["EN2"],
  pin6: ["EN1"],
  pin7: ["N_PGOOD"],
  pin8: ["VSS"],
  pin9: ["N_CHG"],
  pin10: ["OUT1"],
  pin11: ["OUT2"],
  pin12: ["ILIM"],
  pin13: ["IN"],
  pin14: ["TMR"],
  pin15: ["ITERM"],
  pin16: ["ISET"],
  pin17: ["EP"],
} as const

const pinAttributes = {
  pin13: { requiresPower: true },

  pin8: { requiresGround: true },
} as const

export const BQ24074RGTR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C54313"],
      }}
      manufacturerPartNumber="BQ24074RGTR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.499997mm"
            pcbY="0.750189mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.499997mm"
            pcbY="0.250063mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.499997mm"
            pcbY="-0.249809mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.499997mm"
            pcbY="-0.749935mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.749935mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.249809mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.250063mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.750189mm"
            pcbY="-1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.499997mm"
            pcbY="-0.749935mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.499997mm"
            pcbY="-0.249809mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.499997mm"
            pcbY="0.250063mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="1.499997mm"
            pcbY="0.750189mm"
            width="0.850011mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="0.750189mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="0.250063mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-0.249809mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-0.749935mm"
            pcbY="1.499997mm"
            width="0.2800096mm"
            height="0.850011mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            points={[
              { x: "0.8501126mm", y: "0.8501126mm" },
              { x: "0.8501126mm", y: "-0.849884mm" },
              { x: "-0.849884mm", y: "-0.849884mm" },
              { x: "-0.849884mm", y: "0.4251198mm" },
              { x: "-0.4248658mm", y: "0.850138mm" },
            ]}
            solderPasteMargin={-0.0625}
            shape="polygon"
          />
          <platedhole
            shape="circle"
            pcbX={0.0001143}
            pcbY={0.000127}
            holeDiameter={0.3}
            outerDiameter={0.6}
            portHints={["pin17"]}
            coveredWithSolderMask
          />
          <silkscreenpath
            route={[
              { x: 1.2751307999999995, y: -1.7247107999999969 },
              { x: 1.724964799999995, y: -1.7247107999999969 },
              { x: 1.724964799999995, y: -1.2748768000000013 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2751307999999995, y: 1.7251172000000068 },
              { x: 1.724964799999995, y: 1.7251172000000068 },
              { x: 1.724964799999995, y: 1.2752832000000112 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.7248632000000015, y: 1.2752832000000112 },
              { x: -1.7248632000000015, y: 1.7251172000000068 },
              { x: -1.2750292000000059, y: 1.7251172000000068 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.2750292000000059, y: -1.7247107999999969 },
              { x: -1.7248632000000015, y: -1.7247107999999969 },
              { x: -1.7248632000000015, y: -1.2748768000000013 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0751292000000063, y: 1.5242032000000023 },
              { x: -2.2257712297039234, y: 1.6729442559976633 },
              { x: -2.3751486240147415, y: 1.5229332000000042 },
              { x: -2.2257712297039234, y: 1.3729221440023451 },
              { x: -2.0751292000000063, y: 1.521663200000006 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.231775mm"
            pcbY="2.920875mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.6280749999999955, y: 2.1708750000000094 },
              { x: 2.1645249999999976, y: 2.1708750000000094 },
              { x: 2.1645249999999976, y: -2.189924999999988 },
              { x: -2.6280749999999955, y: -2.189924999999988 },
              { x: -2.6280749999999955, y: 2.1708750000000094 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C54313.obj?uuid=6e50ae26fe4f4c2a8ee6b5b5bc616dea",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C54313.step?uuid=6e50ae26fe4f4c2a8ee6b5b5bc616dea",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999999199463, z: 0 },
      }}
      {...props}
    />
  )
}
