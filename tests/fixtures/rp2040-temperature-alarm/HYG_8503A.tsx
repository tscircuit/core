import { Fragment } from "react"
import type { ChipProps } from "@tscircuit/props"
import { symbols } from "schematic-symbols"

const pinLabels = {
  pin1: ["_POS"],
  pin2: ["_NEG"],
  pin3: ["NC1"],
  pin4: ["NC2"],
} as const

const pinAttributes = {
  pin3: { doNotConnect: true },
  pin4: { doNotConnect: true },
} as const

export const HYG_8503A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          {symbols.speaker_right.primitives.map((primitive, index) =>
            primitive.type === "path" ? (
              <Fragment key={index}>
                <schematicpath points={primitive.points} strokeWidth={0.05} />
              </Fragment>
            ) : null,
          )}
          <schematictext
            text={props.name}
            schX={0}
            schY={0.7}
            fontSize={0.18}
          />
          <schematictext text="+" schX={-0.3} schY={0.38} fontSize={0.15} />
          <port
            name="_POS"
            pinNumber={1}
            direction="left"
            schX={-0.4}
            schY={0.2}
          />
          <port
            name="_NEG"
            pinNumber={2}
            direction="left"
            schX={-0.4}
            schY={-0.2}
          />
        </symbol>
      }
      pinAttributes={pinAttributes}
      {...props}
    />
  )
}
