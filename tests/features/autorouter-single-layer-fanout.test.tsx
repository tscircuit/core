import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const TestPad = ({
  pinNumber,
  pcbX,
  pcbY,
}: {
  pinNumber: number
  pcbX: number
  pcbY: number
}) => (
  <smtpad
    portHints={[`pin${pinNumber}`]}
    pcbX={pcbX}
    pcbY={pcbY}
    shape="circle"
    radius="0.175mm"
  />
)

const TestResistor = ({ busIndex }: { busIndex: number }) => (
  <resistor
    name={`R${busIndex + 1}`}
    resistance="1k"
    footprint="0402"
    pcbX={busIndex * 4 - 6}
    pcbY={5}
  />
)

const TestTrace = ({ busIndex }: { busIndex: number }) => (
  <trace
    name={`D${busIndex}`}
    from={`.U1 > .pin${busIndex + 5}`}
    to={`.R${busIndex + 1} > .pin1`}
  />
)

test('autorouter="single_layer_fanout" keeps a complete bus on top', async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const sourcePads = Array.from({ length: 8 }, (_, padIndex) => {
    const pinNumber = padIndex + 1
    return (
      <TestPad
        key={pinNumber}
        pinNumber={pinNumber}
        pcbX={(padIndex % 4) * 0.8 - 1.2}
        pcbY={Math.floor(padIndex / 4) * 0.8 - 0.4}
      />
    )
  })

  circuit.add(
    <board
      width="20mm"
      height="14mm"
      layers={1}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <autoroutingphase
        autorouter="single_layer_fanout"
        busFanoutDirections={{ DATA: "top_center" }}
      />
      <chip
        name="U1"
        pcbY={-2}
        footprint={<footprint>{sourcePads}</footprint>}
      />
      <bus name="DATA" connections={["D0", "D1", "D2", "D3"]} />
      {Array.from({ length: 4 }, (_, busIndex) => (
        <TestResistor key={busIndex} busIndex={busIndex} />
      ))}
      {Array.from({ length: 4 }, (_, busIndex) => (
        <TestTrace key={busIndex} busIndex={busIndex} />
      ))}
      <pcbnotetext
        pcbX={0}
        pcbY={-6}
        fontSize={0.5}
        text='autorouter="single_layer_fanout": top-only bus'
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(8)
  expect(circuit.db.pcb_via.list()).toEqual([])
  expect(
    circuit.db.pcb_trace
      .list()
      .flatMap((trace) => trace.route)
      .filter((routePoint) => routePoint.route_type === "wire")
      .every((routePoint) => routePoint.layer === "top"),
  ).toBe(true)
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(4)
  expect(autoroutingPhaseIoStack[1]?.startSimpleRouteJson?.traces).toHaveLength(
    4,
  )
  expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson?.traces).toHaveLength(8)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouter-single-layer-fanout-autorouting-srj",
    circuit,
  )
})
