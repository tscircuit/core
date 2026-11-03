import { type ConnectorProps } from "@tscircuit/props"
import { jackClearanceModel } from "./clearance-models"
export const SJ13533Ng = (props: ConnectorProps) => (
  <connector
    manufacturerPartNumber="SJ1-3533NG"
    cadModel={jackClearanceModel}
    datasheetUrl="https://www.sameskydevices.com/product/resource/sj1-353xng.pdf"
    pinLabels={{ pin1: "SLEEVE", pin2: "TIP", pin3: "RING" }}
    footprint={
      <footprint insertionDirection="from_top">
        <platedhole
          portHints={["pin1"]}
          pcbX="0mm"
          pcbY="0mm"
          outerDiameter="2.8mm"
          holeDiameter="2mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin2"]}
          pcbX="2mm"
          pcbY="-2.4mm"
          outerDiameter="2.8mm"
          holeDiameter="2mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin3"]}
          pcbX="2mm"
          pcbY="-7.9mm"
          outerDiameter="2.8mm"
          holeDiameter="2mm"
          shape="circle"
        />
        <silkscreenpath
          route={[
            { x: -2.22, y: 5.32 },
            { x: 4.02, y: 5.32 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 4.02, y: 5.32 },
            { x: 4.02, y: 1.32 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 4.02, y: 1.32 },
            { x: 4.32, y: 1.32 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 4.32, y: 1.32 },
            { x: 4.32, y: -12.92 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 4.32, y: -12.92 },
            { x: -4.12, y: -12.92 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -4.12, y: -12.92 },
            { x: -4.12, y: 1.32 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -4.12, y: 1.32 },
            { x: -2.22, y: 1.32 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -2.22, y: 1.32 },
            { x: -2.22, y: 5.32 },
          ]}
          strokeWidth={0.12}
        />
        <fabricationnotepath
          route={[
            { x: -2.1, y: 5.2 },
            { x: 3.9, y: 5.2 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: 3.9, y: 5.2 },
            { x: 3.9, y: 1.2 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: 3.9, y: 1.2 },
            { x: 4.2, y: 1.2 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: 4.2, y: 1.2 },
            { x: 4.2, y: -12.8 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: 4.2, y: -12.8 },
            { x: -4, y: -12.8 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: -4, y: -12.8 },
            { x: -4, y: 1.2 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: -4, y: 1.2 },
            { x: -2.1, y: 1.2 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: -2.1, y: 1.2 },
            { x: -2.1, y: 5.2 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotetext
          pcbX={0.1}
          pcbY={-14.05}
          anchorAlignment="center"
          text="SJ1-3533NG"
          font="tscircuit2024"
          fontSize={1}
        />
        <fabricationnotetext
          pcbX={0.1}
          pcbY={-3.8}
          anchorAlignment="center"
          text="TRS"
          font="tscircuit2024"
          fontSize={1}
        />
        <silkscreentext
          pcbX={0.1}
          pcbY={-13.8}
          anchorAlignment="center"
          fontSize={1}
          font="tscircuit2024"
          layer="top"
          text="{NAME}"
        />
        <courtyardoutline
          outline={[
            { x: -4.5, y: 5.7 },
            { x: -4.5, y: -13.3 },
          ]}
          layer="top"
        />
        <courtyardoutline
          outline={[
            { x: -4.5, y: -13.3 },
            { x: 4.7, y: -13.3 },
          ]}
          layer="top"
        />
        <courtyardoutline
          outline={[
            { x: 4.7, y: -13.3 },
            { x: 4.7, y: 5.7 },
          ]}
          layer="top"
        />
        <courtyardoutline
          outline={[
            { x: 4.7, y: 5.7 },
            { x: -4.5, y: 5.7 },
          ]}
          layer="top"
        />
      </footprint>
    }
    {...props}
  />
)
