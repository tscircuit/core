import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDD"],
  pin2: ["CWD"],
  pin3: ["EN"],
  pin4: ["GND1"],
  pin5: ["SET1"],
  pin6: ["WDI"],
  pin7: ["N_WDO"],
  pin8: ["ENOUT"],
  pin9: ["GND2"],
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin4: { requiresGround: true },
  pin9: { requiresGround: true },
} as const

export const TPS3431SDRBR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C702145"],
      }}
      manufacturerPartNumber="TPS3431SDRBR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.47574mm"
            pcbY="0.9750044mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.47574mm"
            pcbY="0.32512mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.47574mm"
            pcbY="-0.32512mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.47574mm"
            pcbY="-0.97536mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.47574mm"
            pcbY="-0.97536mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.47574mm"
            pcbY="-0.32512mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.47574mm"
            pcbY="0.32512mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.47574mm"
            pcbY="0.97536mm"
            width="0.849884mm"
            height="0.3400044mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            points={[
              { x: "-0.759968mm", y: "0.890016mm" },
              { x: "-0.4700016mm", y: "0.8899906mm" },
              { x: "-0.4700016mm", y: "1.7100042mm" },
              { x: "-0.1800098mm", y: "1.7100042mm" },
              { x: "-0.1800098mm", y: "0.8800084mm" },
              { x: "0.1800098mm", y: "0.8800084mm" },
              { x: "0.1800098mm", y: "1.7100042mm" },
              { x: "0.4700016mm", y: "1.7100042mm" },
              { x: "0.4700016mm", y: "0.8800084mm" },
              { x: "0.7599934mm", y: "0.8800084mm" },
              { x: "0.7599934mm", y: "-0.8899906mm" },
              { x: "0.4700016mm", y: "-0.8899906mm" },
              { x: "0.4700016mm", y: "-1.7100042mm" },
              { x: "0.1800098mm", y: "-1.7100042mm" },
              { x: "0.1800098mm", y: "-0.8899906mm" },
              { x: "-0.1800098mm", y: "-0.8899906mm" },
              { x: "-0.1800098mm", y: "-1.7100042mm" },
              { x: "-0.4700016mm", y: "-1.7100042mm" },
              { x: "-0.4700016mm", y: "-0.8899906mm" },
              { x: "-0.7599934mm", y: "-0.8899906mm" },
              { x: "-0.7599934mm", y: "0.8899906mm" },
              { x: "-0.759968mm", y: "0.890016mm" },
              { x: "-0.759968mm", y: "0.890016mm" },
              { x: "-0.759968mm", y: "0.890016mm" },
            ]}
            shape="polygon"
          />
          <via
            pcbX="0mm"
            pcbY="-0.6249924mm"
            outerDiameter="0.5000244mm"
            holeDiameter="0.3000248mm"
            layers={["top", "bottom"]}
          />
          <via
            pcbX="0mm"
            pcbY="0.6249924mm"
            outerDiameter="0.5000244mm"
            holeDiameter="0.3000248mm"
            layers={["top", "bottom"]}
          />
          <via
            pcbX="-0.499999mm"
            pcbY="0mm"
            outerDiameter="0.5000244mm"
            holeDiameter="0.3000248mm"
            layers={["top", "bottom"]}
          />
          <via
            pcbX="0.499999mm"
            pcbY="0mm"
            outerDiameter="0.5000244mm"
            holeDiameter="0.3000248mm"
            layers={["top", "bottom"]}
          />
          <silkscreenpath
            route={[
              { x: 0.00086359999988872, y: 1.524000000000001 },
              { x: -0.00086359999988872, y: 1.524000000000001 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.524000000000001, y: 1.3245084000000134 },
              { x: 1.524000000000001, y: 1.524000000000001 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.649147800000037, y: -1.524000000000001 },
              { x: 1.524000000000001, y: -1.524000000000001 },
              { x: 1.524000000000001, y: -1.3245083999998997 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.00086359999988872, y: -1.524000000000001 },
              { x: 0.00086359999988872, y: -1.524000000000001 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.524000000000001, y: -1.3245083999998997 },
              { x: -1.524000000000001, y: -1.524000000000001 },
              { x: -0.649147800000037, y: -1.524000000000001 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.649147800000037, y: 1.524000000000001 },
              { x: -1.524000000000001, y: 1.524000000000001 },
              { x: -1.524000000000001, y: 1.3245084000000134 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.524000000000001, y: 1.524000000000001 },
              { x: 0.649147800000037, y: 1.524000000000001 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.905mm"
            pcbY="1.524mm"
            radius="0.055372mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.24892mm"
            pcbY="2.7018mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.1506820000000744, y: 1.9600042000000713 },
              { x: 2.1506820000000744, y: 1.9600042000000713 },
              { x: 2.1506820000000744, y: -1.9600041999999576 },
              { x: -2.1506820000000744, y: -1.9600041999999576 },
              { x: -2.1506820000000744, y: 1.9600042000000713 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C702145.obj?uuid=e674e2bdf5a0456bb02fe0267cbd5342",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C702145.step?uuid=e674e2bdf5a0456bb02fe0267cbd5342",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
