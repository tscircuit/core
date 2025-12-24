import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A switch shaft you can use to connect a pluggable Kailh socket.
 *
 * Datasheet: https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/lcsc/2211090930_Kailh-CPG151101S11-1_C5184526.pdf
 */
const SwitchShaft = (props: {
  name: string
  pcbX?: number
  pcbY?: number
}) => (
  <chip
    {...props}
    footprint={
      <footprint>
        {/* <silkscreentext text={props.name} /> */}
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin1"]}
          layer="top"
        />
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin2"]}
          layer="top"
        />
        <hole name="H1" diameter="3mm" />
        <hole name="H2" diameter="3mm" />
        <constraint xDist="6.35mm" centerToCenter left=".H1" right=".H2" />
        <constraint yDist="2.54mm" centerToCenter top=".H1" bottom=".H2" />
        <constraint edgeToEdge xDist="11.3mm" left=".pin1" right=".pin2" />
        <constraint sameY for={[".pin1", ".H1"]} />
        <constraint sameY for={[".pin2", ".H2"]} />
        <constraint
          edgeToEdge
          xDist={(11.3 - 6.35 - 3) / 2}
          left=".pin1"
          right=".H1"
        />
      </footprint>
    }
  />
)

const Key = (props: {
  name: string
  keyNum: number
  pcbX: number
  pcbY: number
}) => {
  const shaftName = `SW${props.keyNum}`
  const diodeName = `D${props.keyNum}`
  return (
    <>
      <SwitchShaft
        key="shaft1"
        name={shaftName}
        pcbX={props.pcbX}
        pcbY={props.pcbY}
      />
      <diode
        // @ts-ignore
        key="diode"
        pcbRotation={-90}
        name={diodeName}
        footprint="0603"
        pcbX={props.pcbX + 7}
        pcbY={props.pcbY - 6}
      />
      <trace
        // @ts-ignore
        key="trace1"
        from={`.${shaftName} .pin2`}
        to={`.${diodeName} .pin1`}
      />
    </>
  )
}

const ArduinoProMicroBreakout = (props: {
  name: string
  pcbX?: number
  pcbY?: number
}) => (
  <chip
    {...props}
    footprint="dip24_w0.7in_h1.3in"
    pinLabels={{
      pin1: "TXD",
      pin2: "RXI",
      pin3: "GND1",
      pin4: "GND2",
      pin5: "D2",
      pin6: "D3",
      pin7: "D4",
      pin8: "D5",
      pin9: "D6",
      pin10: "D7",
      pin11: "D8",
      pin12: "D9",
      // right side (from bottom)
      pin13: "D10",
      pin14: "D16",
      pin15: "D14",
      pin16: "D15",
      pin17: "A0",
      pin18: "A1",
      pin19: "A2",
      pin20: "A3",
      pin21: "VCC",
      pin22: "RST",
      pin23: "GND3",
      pin24: "RAW",
    }}
  />
)

const MacroKeypad = () => {
  const keyPositions = Array.from({ length: 9 })
    .map((_, i) => ({
      keyNum: i + 1,
      col: i % 3,
      row: Math.floor(i / 3),
    }))
    .map((p) => ({
      ...p,
      x: p.col * 19.05 - 19.05,
      y: p.row * 19.05 - 19.05,
    }))

  const rowToMicroPin = {
    0: "D2",
    1: "D3",
    2: "D4",
  }
  const colToMicroPin = {
    0: "D5",
    1: "D6",
    2: "D7",
  }

  return (
    <board width="120mm" height="80mm">
      {keyPositions.map(({ keyNum, x, y }) => (
        <Key
          key={keyNum}
          name={`K${keyNum}`}
          keyNum={keyNum}
          pcbX={x}
          pcbY={y}
        />
      ))}
      <ArduinoProMicroBreakout key="u1" name="U1" pcbX={44} />
      {keyPositions.map(({ keyNum, row, col }) => (
        <trace
          // @ts-ignore
          key={`trace-${keyNum}-col`}
          from={`.SW${keyNum} .pin1`}
          to={`.U1 .${colToMicroPin[col as 0 | 1 | 2]}`}
        />
      ))}
      {keyPositions.map(({ keyNum, row, col }) => (
        <trace
          // @ts-ignore
          key={`trace-${keyNum}-row`}
          from={`.D${keyNum} .pin2`}
          to={`.U1 .${rowToMicroPin[row as 0 | 1 | 2]}`}
        />
      ))}
    </board>
  )
}

// CI IS TOO SLOW TO ROUTE! TODO autorouter bug
test.skip("example3-2x2-keyboard", () => {
  const { circuit } = getTestFixture()

  circuit.add(<MacroKeypad />)

  const circuitJson = circuit.getCircuitJson()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
