import { type ConnectorProps } from "@tscircuit/props"
import { batteryClearanceModel } from "./clearance-models"
export const JstBattery = (props: ConnectorProps) => (
  <connector
    schMarginX="2mm"
    schMarginY="1mm"
    manufacturerPartNumber="B3B-PH-K-S(LF)(SN)"
    cadModel={batteryClearanceModel}
    pinLabels={{ pin1: "BAT_PLUS", pin2: "NTC", pin3: "GND" }}
    footprint={
      <footprint insertionDirection="from_above">
        <platedhole
          portHints={["pin1"]}
          pcbX="0mm"
          pcbY="0mm"
          holeShape="circle"
          padShape="rect"
          holeDiameter="0.75mm"
          rectPadWidth="1.2mm"
          rectPadHeight="1.75mm"
          rectBorderRadius="0.1249998mm"
          holeOffsetX="0mm"
          holeOffsetY="0mm"
          pcbRotation="0deg"
          shape="circular_hole_with_rect_pad"
        />
        <platedhole
          portHints={["pin2"]}
          pcbX="2mm"
          pcbY="0mm"
          outerHeight="1.75mm"
          outerWidth="1.2mm"
          holeHeight="0.75mm"
          holeWidth="0.75mm"
          shape="pill"
          pcbRotation="0deg"
        />
        <platedhole
          portHints={["pin3"]}
          pcbX="4mm"
          pcbY="0mm"
          outerHeight="1.75mm"
          outerWidth="1.2mm"
          holeHeight="0.75mm"
          holeWidth="0.75mm"
          shape="pill"
          pcbRotation="0deg"
        />
        <silkscreenpath
          route={[
            { x: -2.06, y: 1.81 },
            { x: -2.06, y: -2.91 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -2.06, y: -2.91 },
            { x: 6.06, y: -2.91 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 6.06, y: -2.91 },
            { x: 6.06, y: 1.81 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 6.06, y: 1.81 },
            { x: -2.06, y: 1.81 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -0.3, y: 1.81 },
            { x: -0.3, y: 2.01 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -0.3, y: 2.01 },
            { x: -0.6, y: 2.01 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -0.6, y: 2.01 },
            { x: -0.6, y: 1.81 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -0.3, y: 1.91 },
            { x: -0.6, y: 1.91 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 0.5, y: 1.81 },
            { x: 0.5, y: 1.2 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 0.5, y: 1.2 },
            { x: -1.45, y: 1.2 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -1.45, y: 1.2 },
            { x: -1.45, y: -2.3 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -1.45, y: -2.3 },
            { x: 5.45, y: -2.3 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 5.45, y: -2.3 },
            { x: 5.45, y: 1.2 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 5.45, y: 1.2 },
            { x: 3.5, y: 1.2 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 3.5, y: 1.2 },
            { x: 3.5, y: 1.81 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -2.06, y: 0.5 },
            { x: -1.45, y: 0.5 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -2.06, y: -0.8 },
            { x: -1.45, y: -0.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 6.06, y: 0.5 },
            { x: 5.45, y: 0.5 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 6.06, y: -0.8 },
            { x: 5.45, y: -0.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 0.9, y: -2.3 },
            { x: 0.9, y: -1.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 0.9, y: -1.8 },
            { x: 1.1, y: -1.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 1.1, y: -1.8 },
            { x: 1.1, y: -2.3 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 1, y: -2.3 },
            { x: 1, y: -1.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 2.9, y: -2.3 },
            { x: 2.9, y: -1.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 2.9, y: -1.8 },
            { x: 3.1, y: -1.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 3.1, y: -1.8 },
            { x: 3.1, y: -2.3 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: 3, y: -2.3 },
            { x: 3, y: -1.8 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -1.11, y: 2.11 },
            { x: -2.36, y: 2.11 },
          ]}
          strokeWidth={0.12}
        />
        <silkscreenpath
          route={[
            { x: -2.36, y: 2.11 },
            { x: -2.36, y: 0.86 },
          ]}
          strokeWidth={0.12}
        />
        <fabricationnotepath
          route={[
            { x: -1.11, y: 2.11 },
            { x: -2.36, y: 2.11 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: -2.36, y: 2.11 },
            { x: -2.36, y: 0.86 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: -1.95, y: 1.7 },
            { x: -1.95, y: -2.8 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: -1.95, y: -2.8 },
            { x: 5.95, y: -2.8 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: 5.95, y: -2.8 },
            { x: 5.95, y: 1.7 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotepath
          route={[
            { x: 5.95, y: 1.7 },
            { x: -1.95, y: 1.7 },
          ]}
          strokeWidth={0.1}
        />
        <fabricationnotetext
          pcbX={2}
          pcbY={-4}
          anchorAlignment="center"
          text="JST PH 3P"
          font="tscircuit2024"
          fontSize={1}
        />
        <fabricationnotetext
          pcbX={2}
          pcbY={-1.5}
          anchorAlignment="center"
          text="BAT/NTC/GND"
          font="tscircuit2024"
          fontSize={1}
        />
        <silkscreentext
          pcbX={2}
          pcbY={2.9}
          anchorAlignment="center"
          fontSize={1}
          font="tscircuit2024"
          layer="top"
          text="{NAME}"
        />
        <courtyardoutline
          outline={[
            { x: -2.45, y: 2.2 },
            { x: -2.45, y: -3.3 },
          ]}
          layer="top"
        />
        <courtyardoutline
          outline={[
            { x: -2.45, y: -3.3 },
            { x: 6.45, y: -3.3 },
          ]}
          layer="top"
        />
        <courtyardoutline
          outline={[
            { x: 6.45, y: -3.3 },
            { x: 6.45, y: 2.2 },
          ]}
          layer="top"
        />
        <courtyardoutline
          outline={[
            { x: 6.45, y: 2.2 },
            { x: -2.45, y: 2.2 },
          ]}
          layer="top"
        />
      </footprint>
    }
    {...props}
  />
)
