import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["B"],
  pin2: ["E"],
  pin3: ["C"],
} as const

export const MMBT3904_RANGE_100_300_ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <transistor
      type="npn"
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin3"
            pinNumber={3}
            aliases={["C"]}
            direction="up"
            schX={0.2}
            schY={0.4}
            schStemLength={0.2}
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["B"]}
            direction="left"
            schX={-0.2}
            schY={0}
            schStemLength={0.2}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["E"]}
            direction="down"
            schX={0.2}
            schY={-0.4}
            schStemLength={0.2}
          />
          <schematicpath
            points={[
              { x: 0.2, y: 0.2 },
              { x: 0, y: 0.06 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.06 },
              { x: 0.2, y: -0.2 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.18 },
              { x: 0, y: -0.18 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.2, y: -0.2 },
              { x: 0.14, y: -0.1 },
              { x: 0.08, y: -0.18 },
              { x: 0.2, y: -0.2 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematictext
            schX={0}
            schY={0.64}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      manufacturerPartNumber="MMBT3904(RANGE:100-300)"
      {...props}
    />
  )
}
