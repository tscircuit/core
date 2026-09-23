import { LengthTestTerminal } from "./length-test-terminal"

/** Board-space points in mm: +X right, +Y up, right-handed; pcbPath points are relative to TX.pin1. */
export const ViaSelfShortBoard = ({
  message,
  viaDiameter = 0.7,
}: { message?: string; viaDiameter?: number }) => (
  <board
    width={28}
    height={20}
    pcbStyle={{
      viaPadDiameter: viaDiameter,
      viaHoleDiameter: Math.min(0.3, viaDiameter / 2),
    }}
    schematicDisabled
  >
    <bus name="DATA" connections={["DATA_P"]} maxLengthSkew="0.1mm" />
    <LengthTestTerminal name="TX" x={-9} y={-3} />
    <chip
      name="RX"
      pcbX={-9}
      pcbY={1}
      layer="bottom"
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
    <trace
      name="DATA_P"
      from=".TX > .pin1"
      to=".RX > .pin1"
      thickness={0.25}
      pcbPathRelativeTo=".TX > .pin1"
      pcbPath={[
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 2 },
        { x: 15, y: 2 },
        { x: 15, y: 7 },
        { x: 9, y: 7 },
        { x: 9, y: 2.4, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: 6, y: 2.4 },
        { x: 6, y: 4 },
        { x: 0, y: 4 },
      ]}
    />
    <pcbnotetext
      text={
        viaDiameter >= 0.7 ? "DATA_P: VIA SELF-SHORT" : "DATA_P: VIA CLEARANCE"
      }
      pcbY={8}
      fontSize={1.2}
    />
    <pcbnotetext text="TX" pcbX={-11} pcbY={-3} fontSize={0.8} />
    <pcbnotetext text="RX" pcbX={-11} pcbY={1} fontSize={0.8} />
    {message && (
      <pcbnotetext
        text={message.replace(", ", ",\n")}
        pcbY={-7}
        fontSize={0.65}
        color="#ff6b6b"
      />
    )}
  </board>
)
