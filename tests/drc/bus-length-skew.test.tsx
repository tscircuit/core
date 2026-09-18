import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const BusSkewViolation = ({ errorMessage }: { errorMessage?: string }) => (
  <board width={44} height={34} schematicDisabled>
    <bus name="DATA" connections={["D0", "D1"]} maxLengthSkew="2mm" />
    <LengthTestTerminal name="TX0" x={-10} y={6} />
    <LengthTestTerminal name="RX0" x={10} y={6} />
    <LengthTestTerminal name="TX1" x={-10} y={0} />
    <LengthTestTerminal name="RX1" x={10} y={0} />
    <trace
      name="D0"
      from=".TX0 > .pin1"
      to=".RX0 > .pin1"
      thickness={0.35}
      pcbPathRelativeTo=".TX0 > .pin1"
      pcbPath={[
        { x: 0, y: 0 },
        { x: 20, y: 0 },
      ]}
    />
    <trace
      name="D1"
      from=".TX1 > .pin1"
      to=".RX1 > .pin1"
      thickness={0.35}
      pcbPathRelativeTo=".TX1 > .pin1"
      pcbPath={[
        { x: 0, y: 0 },
        { x: 0, y: -5 },
        { x: 20, y: -5 },
        { x: 20, y: 0 },
      ]}
    />

    <pcbnotetext
      text="DATA BUS: LENGTH-SKEW VIOLATION"
      pcbY={14}
      fontSize={1.15}
      color="white"
    />
    <pcbnotetext
      text={`<bus name="DATA" connections={["D0", "D1"]}
  maxLengthSkew="2mm" />`}
      pcbX={-10}
      pcbY={12}
      anchorAlignment="top_left"
      fontSize={0.9}
      color="#ffd166"
    />
    <pcbnotetext text="D0: 20 mm total" pcbY={8.3} fontSize={0.9} />
    <pcbnotetext text="20 mm" pcbY={4.5} fontSize={0.8} />
    <pcbnotetext text="D1: 30 mm total" pcbY={1.8} fontSize={0.9} />
    <pcbnotetext text="5 mm" pcbX={-13} pcbY={-2.5} fontSize={0.8} />
    <pcbnotetext text="5 mm" pcbX={13} pcbY={-2.5} fontSize={0.8} />
    <pcbnotetext text="20 mm" pcbY={-6.5} fontSize={0.8} />
    <pcbnotetext
      text="Skew = 30 - 20 = 10 mm > 2 mm allowed"
      pcbY={-9.5}
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

test("renderUntilSettled emits pcb_bus_length_skew_error through board routing DRC", async () => {
  const { circuit } = getTestFixture()
  const asyncErrors: string[] = []
  circuit.on("asyncEffect:end", ({ error }) => {
    if (error) asyncErrors.push(error)
  })
  circuit.add(<BusSkewViolation />)
  await circuit.renderUntilSettled()
  expect(asyncErrors).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  const errors = circuit.db.pcb_bus_length_skew_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    type: "pcb_bus_length_skew_error",
    actual_length_skew: 10,
    maximum_length_skew: 2,
  })
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_bus_length_skew_error.list()).toHaveLength(1)

  const { circuit: annotated } = getTestFixture()
  annotated.add(<BusSkewViolation errorMessage={errors[0].message} />)
  await annotated.renderUntilSettled()
  expect(annotated.db.pcb_bus_length_skew_error.list()).toEqual(errors)
  await expect(annotated).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 900,
  })
})
