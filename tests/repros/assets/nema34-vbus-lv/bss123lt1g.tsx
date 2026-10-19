// Schematic-only extract from techmannih/nema34-mounted-stepper-controller v0.3.77.
// Original: imports/BSS123LT1G.tsx, release aac31e97-3a2f-4a03-b9e3-ae40ab7be9b9.
// Body paths, reference text, terminal positions and stem lengths are unchanged.
// Coordinates are symbol-local mm, +X right and +Y up.
import type { MosfetProps } from "@tscircuit/props"

export const BSS123LT1G = (
  props: Omit<MosfetProps, "channelType" | "mosfetMode">,
) => {
  const { name = "Q1", ...restProps } = props
  return (
    <mosfet
      name={name}
      channelType="n"
      mosfetMode="enhancement"
      symbol={
        <symbol>
          <schematictext
            text={name}
            schX={0}
            schY={0.7}
            fontSize={0.22}
            color="#006464"
            anchor="bottom_center"
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0.381, y: -0.127 },
              { x: 0.381, y: 0.127 },
              { x: 0, y: 0 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 1.27, y: 0.127 },
              { x: 1.0795, y: -0.1905 },
              { x: 1.4605, y: -0.1905 },
              { x: 1.27, y: 0.127 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.4445 },
              { x: 0.635, y: 0.4445 },
              { x: 0.635, y: 0.635 },
              { x: 1.27, y: 0.635 },
              { x: 1.27, y: 0.127 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0.635, y: 0 },
              { x: 0.635, y: -0.635 },
              { x: 1.27, y: -0.635 },
              { x: 1.27, y: -0.1905 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.635, y: -0.4445 },
              { x: 0, y: -0.4445 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.127, y: 0.5715 },
              { x: -0.127, y: -0.5715 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.5715 },
              { x: 0, y: 0.3175 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.127 },
              { x: 0, y: 0.127 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.5715 },
              { x: 0, y: -0.3175 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.635, y: 0 },
              { x: -0.127, y: 0 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 1.524, y: 0.127 },
              { x: 1.397, y: 0.127 },
              { x: 1.143, y: 0.127 },
              { x: 1.016, y: 0.127 },
            ]}
            strokeWidth={0.035}
            strokeColor="#880000"
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["D", "drain"]}
            direction="up"
            schX={0.635}
            schY={1.27}
            schStemLength={0.635}
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["G", "gate"]}
            direction="left"
            schX={-1.27}
            schY={0}
            schStemLength={0.635}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["S", "source"]}
            direction="down"
            schX={0.635}
            schY={-1.27}
            schStemLength={0.635}
          />
        </symbol>
      }
      {...restProps}
    />
  )
}
