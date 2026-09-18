import { LengthTestTerminal } from "./length-test-terminal"

export const LengthDrcTrace = ({
  explanation,
  explanationColor,
}: { explanation: string; explanationColor?: string }) => (
  <>
    <LengthTestTerminal name="TX" x={-10} y={3} />
    <LengthTestTerminal name="RX" x={10} y={3} />
    <trace
      name="D1"
      from=".TX > .pin1"
      to=".RX > .pin1"
      maxLength="24mm"
      thickness={0.35}
      pcbPathRelativeTo=".TX > .pin1"
      pcbPath={[
        { x: 0, y: 0 },
        { x: 0, y: -5 },
        { x: 20, y: -5 },
        { x: 20, y: 0 },
      ]}
    />
    <pcbnotetext
      text={
        '<trace name="D1" from=".TX > .pin1"\n  to=".RX > .pin1" maxLength="24mm" />'
      }
      pcbX={-12}
      pcbY={10}
      anchorAlignment="top_left"
      fontSize={0.9}
      color="#ffd166"
    />
    <pcbnotetext text="D1: 30 mm routed length" pcbY={5.5} fontSize={1} />
    <pcbnotetext text="5 mm" pcbX={-13} pcbY={0.5} fontSize={0.8} />
    <pcbnotetext text="5 mm" pcbX={13} pcbY={0.5} fontSize={0.8} />
    <pcbnotetext text="20 mm" pcbY={-3.5} fontSize={0.8} />
    <pcbnotetext
      text={explanation}
      color={explanationColor}
      pcbX={-13}
      pcbY={-7}
      anchorAlignment="top_left"
      fontSize={0.85}
    />
  </>
)
