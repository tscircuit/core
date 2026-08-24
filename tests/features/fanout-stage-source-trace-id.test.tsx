import { expect, test } from "bun:test"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout stage output preserves source trace identity", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const pads = Array.from({ length: 16 }, (_, padIndex) => {
    const pinNumber = padIndex + 1
    return (
      <Fragment key={pinNumber}>
        <smtpad
          portHints={[`pin${pinNumber}`]}
          pcbX={(padIndex % 4) * 0.8 - 1.2}
          pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
          shape="circle"
          radius="0.175mm"
        />
      </Fragment>
    )
  })

  circuit.add(
    <board
      width="14mm"
      height="10mm"
      layers={4}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <breakout
        name="SOC_BREAKOUT"
        width="10mm"
        height="8mm"
        fanoutRoutingLayers={["top", "bottom"]}
        busFanoutDirections={{ DDR: "center_right" }}
      >
        <chip name="U1" footprint={<footprint>{pads}</footprint>} />
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} />
        <bus name="DDR" connections={["DDR_D0", "DDR_D1"]} />
        <trace name="DDR_D0" from=".U1 > .pin7" to=".R1 > .pin1" />
        <trace name="DDR_D1" from=".U1 > .pin8" to=".R1 > .pin2" />
      </breakout>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(1)
  const fanoutTraces = autoroutingPhaseIoStack[0]!.endSimpleRouteJson?.traces
  expect(fanoutTraces).toHaveLength(2)
  const fanoutTracesWithOptionalSourceTraceId = fanoutTraces as
    | Array<
        NonNullable<typeof fanoutTraces>[number] & {
          source_trace_id?: string
        }
      >
    | undefined
  expect(
    fanoutTracesWithOptionalSourceTraceId?.every(
      (trace) => trace.source_trace_id !== undefined,
    ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
