import { Fragment } from "react"

export const CopperTextRoutingBoard = ({
  includeCopperText = true,
}: {
  includeCopperText?: boolean
}) => (
  <board width={12} height={10} autorouter="auto-local">
    {includeCopperText && (
      <coppertext
        text="-"
        fontSize={10}
        pcbX={0.5}
        layer="top"
        anchorAlignment="center"
      />
    )}
    {[-0.4, 0.4].map((pcbX, column) => (
      <Fragment key={column}>
        {[-3, 3].map((pcbY, row) => (
          <chip
            key={row}
            name={`J${column * 2 + row + 1}`}
            pcbX={pcbX}
            pcbY={pcbY}
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  shape="rect"
                  width={0.25}
                  height={0.25}
                />
                <courtyardrect width={0.35} height={0.35} />
              </footprint>
            }
          />
        ))}
        <trace
          name={`SIGNAL_${column + 1}`}
          from={`.J${column * 2 + 1} > .pin1`}
          to={`.J${column * 2 + 2} > .pin1`}
        />
      </Fragment>
    ))}
    <pcbnotetext
      text={
        includeCopperText
          ? "BUG: copper dash joins two separate signal nets"
          : "CONTROL: same two signal nets, no copper text"
      }
      pcbY={4.4}
      fontSize={0.3}
    />
  </board>
)
