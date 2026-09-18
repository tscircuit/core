import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const TraceLengthViolation = ({ errorMessage }: { errorMessage?: string }) => (
  <board width={44} height={40} schematicDisabled>
    <LengthTestTerminal name="TX" x={-10} y={5} />
    <LengthTestTerminal name="RX" x={10} y={5} />
    <trace
      name="D1"
      from=".TX > .pin1"
      to=".RX > .pin1"
      thickness={0.35}
      maxLength="24mm"
      pcbPathRelativeTo=".TX > .pin1"
      pcbPath={[
        { x: 0, y: 0 },
        { x: 0, y: -5 },
        { x: 20, y: -5 },
        { x: 20, y: 0 },
      ]}
    />

    <pcbnotetext
      text="D1: TRACE-LENGTH VIOLATION"
      pcbY={18}
      fontSize={1.15}
      color="white"
    />
    <pcbnotetext
      text={`<trace name="D1" from=".TX > .pin1" to=".RX > .pin1"
  maxLength="24mm" thickness={0.35}
  pcbPathRelativeTo=".TX > .pin1"
  pcbPath={[{ x: 0, y: 0 }, { x: 0, y: -5 },
    { x: 20, y: -5 }, { x: 20, y: 0 }]} />`}
      pcbX={-12}
      pcbY={15.8}
      anchorAlignment="top_left"
      fontSize={0.9}
      color="#ffd166"
    />
    <pcbnotetext text="TX" pcbX={-10} pcbY={7} fontSize={0.9} />
    <pcbnotetext text="RX" pcbX={10} pcbY={7} fontSize={0.9} />
    <pcbnotetext text="D1" pcbY={3} fontSize={1} />
    <pcbnotetext text="5 mm" pcbX={-13} pcbY={2.5} fontSize={0.8} />
    <pcbnotetext text="5 mm" pcbX={13} pcbY={2.5} fontSize={0.8} />
    <pcbnotetext text="20 mm" pcbY={-1.5} fontSize={0.8} />
    <pcbnotetext
      text="Routed length = 5 + 20 + 5 = 30 mm"
      pcbY={-5}
      fontSize={1}
    />
    <pcbnotetext
      text="30 mm > 24 mm limit: 6 mm too long"
      pcbY={-8}
      fontSize={1}
      color="#ff6b6b"
    />
    {errorMessage && (
      <pcbnotetext
        text={`DRC: ${errorMessage.replace(", ", ",\n")}`}
        pcbX={-10}
        pcbY={-12.5}
        anchorAlignment="top_left"
        fontSize={0.8}
        color="#ff6b6b"
      />
    )}
  </board>
)

test("renderUntilSettled emits pcb_trace_too_long_error through board routing DRC", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<TraceLengthViolation />)
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_trace_too_long_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    type: "pcb_trace_too_long_error",
    actual_trace_length: 30,
    maximum_trace_length: 24,
  })
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace_too_long_error.list()).toHaveLength(1)

  const { circuit: annotated } = getTestFixture()
  annotated.add(<TraceLengthViolation errorMessage={errors[0].message} />)
  await annotated.renderUntilSettled()
  expect(annotated.db.pcb_trace_too_long_error.list()).toEqual(errors)
  await expect(annotated).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 900,
  })
})
