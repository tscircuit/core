export const LengthTestTerminal = ({
  name,
  x,
  y,
}: { name: string; x: number; y: number }) => (
  <chip
    name={name}
    pcbX={x}
    pcbY={y}
    pinLabels={{ pin1: "SIGNAL" }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX={0}
          pcbY={0}
          width={1}
          height={1}
          shape="rect"
        />
      </footprint>
    }
  />
)
