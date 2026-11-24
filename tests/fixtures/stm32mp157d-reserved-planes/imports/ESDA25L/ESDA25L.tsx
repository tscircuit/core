import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
} as const

export const ESDA25L = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin1"
            pinNumber={1}
            aliases={["1"]}
            direction="left"
            schX={-0.8}
            schY={0.4}
            schStemLength={0.4}
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["3"]}
            direction="right"
            schX={0.8}
            schY={0}
            schStemLength={0.4}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="left"
            schX={-0.8}
            schY={-0.4}
            schStemLength={0.4}
          />
          <schematicrect
            schX={-0.01}
            schY={0}
            width={0.78}
            height={1.2}
            strokeWidth={0.02}
            color="#880000"
          />
          <schematicpath
            points={[
              { x: -0.4, y: 0.4 },
              { x: -0.2, y: 0.4 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.4, y: -0.4 },
              { x: -0.2, y: -0.4 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.4 },
              { x: 0.2, y: 0.4 },
              { x: 0.2, y: -0.4 },
              { x: 0, y: -0.4 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.4, y: 0 },
              { x: 0.2, y: 0 },
            ]}
            strokeColor="#880000"
          />
          <schematiccircle
            center={{ x: 0.2, y: 0 }}
            radius={0.02}
            strokeWidth={0.02}
            color="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.5 },
              { x: -0.2, y: 0.4 },
              { x: 0, y: 0.3 },
              { x: 0, y: 0.5 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.24, y: 0.48 },
              { x: -0.24, y: 0.52 },
              { x: -0.2, y: 0.52 },
              { x: -0.2, y: 0.28 },
              { x: -0.16, y: 0.28 },
              { x: -0.16, y: 0.32 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.3 },
              { x: -0.2, y: -0.4 },
              { x: 0, y: -0.5 },
              { x: 0, y: -0.3 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.24, y: -0.32 },
              { x: -0.24, y: -0.28 },
              { x: -0.2, y: -0.28 },
              { x: -0.2, y: -0.52 },
              { x: -0.16, y: -0.52 },
              { x: -0.16, y: -0.48 },
            ]}
            strokeColor="#880000"
          />
          <schematictext
            schX={0}
            schY={0.8}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C95343"],
      }}
      manufacturerPartNumber="ESDA25L"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="0.999998mm"
            pcbY="-0.94996mm"
            width="0.999998mm"
            height="0.6500114mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.999998mm"
            pcbY="0.94996mm"
            width="0.999998mm"
            height="0.6500114mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.999998mm"
            pcbY="0mm"
            width="0.999998mm"
            height="0.6500114mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.726211400000011, y: 1.5262098000000606 },
              { x: -0.726211400000011, y: 1.5262098000000606 },
              { x: -0.726211400000011, y: 0.49458879999997407 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.726211400000011, y: -1.5262097999999469 },
              { x: -0.726211400000011, y: -1.5262097999999469 },
              { x: -0.726211400000011, y: -0.49458879999997407 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.726211400000011, y: 0.45539659999997184 },
              { x: 0.726211400000011, y: -0.45539659999985815 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0254mm"
            pcbY="2.524mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.7499969999998939, y: 1.6999844000000621 },
              { x: 1.7499969999998939, y: 1.6999844000000621 },
              { x: 1.7499969999998939, y: -1.7000097999999753 },
              { x: -1.7499969999998939, y: -1.7000097999999753 },
              { x: -1.7499969999998939, y: 1.6999844000000621 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C95343.obj?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C95343.step?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.000012700000070253736,
          y: -0.000012699999956566899,
          z: 0.050795,
        },
      }}
      {...props}
    />
  )
}
