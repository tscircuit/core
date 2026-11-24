import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
} as const

export const ESDA6V1L = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin1"
            pinNumber={1}
            aliases={["1"]}
            direction="down"
            schX={-0.4}
            schY={-0.8}
            schStemLength={0.4}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="down"
            schX={0.4}
            schY={-0.8}
            schStemLength={0.4}
          />
          <schematicpath
            points={[
              { x: -0.4, y: 0 },
              { x: -0.4, y: 0.2 },
              { x: 0.4, y: 0.2 },
              { x: 0.4, y: 0 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.2 },
              { x: 0, y: 0.4 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.4, y: -0.2 },
              { x: -0.4, y: -0.4 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.4, y: -0.2 },
              { x: 0.4, y: -0.4 },
            ]}
            strokeColor="#880000"
          />
          <schematiccircle
            center={{ x: 0, y: 0.2 }}
            radius={0.02}
            strokeWidth={0.02}
            color="#880000"
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["3"]}
            direction="up"
            schX={0}
            schY={0.8}
            schStemLength={0.4}
          />
          <schematicrect
            schX={0}
            schY={0}
            width={1.6}
            height={0.8}
            strokeWidth={0.02}
            color="#880000"
          />
          <schematicpath
            svgPath="M -0.52 0 L -0.4 -0.2 L -0.26 0 Z"
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.24, y: -0.24 },
              { x: -0.24, y: -0.2 },
              { x: -0.54, y: -0.2 },
              { x: -0.54, y: -0.14 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.28 0 L 0.4 -0.2 L 0.54 0 Z"
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.56, y: -0.24 },
              { x: 0.56, y: -0.2 },
              { x: 0.26, y: -0.2 },
              { x: 0.26, y: -0.14 },
            ]}
            strokeColor="#880000"
          />
          <schematictext
            schX={0}
            schY={1.04}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C24378"],
      }}
      manufacturerPartNumber="ESDA6V1L"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="1.101344mm"
            pcbY="-0.94996mm"
            width="1.0374884mm"
            height="0.532003mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.101344mm"
            pcbY="0.94996mm"
            width="1.0374884mm"
            height="0.532003mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.101344mm"
            pcbY="0mm"
            width="1.0374884mm"
            height="0.532003mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.8586978000000727, y: 1.5262098000000606 },
              { x: -0.8586978000000727, y: 1.5262098000000606 },
              { x: -0.8586978000000727, y: 0.49458879999997407 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8586978000000727, y: -1.5262097999999469 },
              { x: -0.8586978000000727, y: -1.5262097999999469 },
              { x: -0.8586978000000727, y: -0.49458879999997407 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8586978000000727, y: 0.45539659999997184 },
              { x: 0.8586978000000727, y: -0.45539659999985815 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0635mm"
            pcbY="2.524mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.8700882000000547, y: 1.700009800000089 },
              { x: 1.870088199999941, y: 1.700009800000089 },
              { x: 1.870088199999941, y: -1.6999843999999484 },
              { x: -1.8700882000000547, y: -1.6999843999999484 },
              { x: -1.8700882000000547, y: 1.700009800000089 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C24378.obj?uuid=cefd4596db214da394d9632b2b88f8f2",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C24378.step?uuid=cefd4596db214da394d9632b2b88f8f2",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
