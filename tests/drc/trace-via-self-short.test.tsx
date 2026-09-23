import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const SelfShortBoard = ({
  message,
  viaDiameter = 0.7,
}: { message?: string; viaDiameter?: number }) => (
  <board
    width={28}
    height={20}
    pcbStyle={{ viaPadDiameter: viaDiameter, viaHoleDiameter: 0.3 }}
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
    <pcbnotetext text="DATA_P: VIA SELF-SHORT" pcbY={8} fontSize={1.2} />
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

test("board routing DRC detects a subtle via self-short on a matched trace", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<SelfShortBoard />)
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_trace_error
    .list()
    .filter((error) => error.message.includes("shorts to itself"))
  expect(errors).toHaveLength(1)
  expect(errors[0]!.message).toBe(
    'PCB trace "DATA_P" shorts to itself, bypassing part of its length-matched route',
  )
  expect(errors[0]!.center?.x).toBeCloseTo(0)
  expect(errors[0]!.center?.y).toBeCloseTo(-0.8)
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("shorts to itself")),
  ).toEqual(errors)

  const { circuit: cleared } = getTestFixture()
  cleared.add(<SelfShortBoard viaDiameter={0.3} />)
  await cleared.renderUntilSettled()
  expect(
    cleared.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("shorts to itself")),
  ).toEqual([])

  const { circuit: annotated } = getTestFixture()
  annotated.add(<SelfShortBoard message={errors[0]!.message} />)
  await annotated.renderUntilSettled()
  await expect(annotated).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 750,
    shouldDrawErrors: false,
  })
})
