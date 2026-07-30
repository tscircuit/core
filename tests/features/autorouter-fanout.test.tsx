import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const innerPinNumbers = [6, 7, 10, 11]

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

const TestResistor = ({
  busIndex,
  pcbY,
}: {
  busIndex: number
  pcbY: number
}) => (
  <resistor
    name={`R${busIndex + 1}`}
    resistance="1k"
    footprint="0402"
    pcbX={5}
    pcbY={pcbY}
  />
)

const TestTrace = ({
  pinNumber,
  busIndex,
}: {
  pinNumber: number
  busIndex: number
}) => (
  <trace
    name={`D${busIndex}`}
    from={`.U1 > .pin${pinNumber}`}
    to={`.R${busIndex + 1} > .pin1`}
  />
)

test('autorouter="fanout" escapes an inner BGA bus before board routing', async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const bgaPads = Array.from({ length: 16 }, (_, padIndex) => {
    const pinNumber = padIndex + 1
    return (
      <TestPad
        key={pinNumber}
        pinNumber={pinNumber}
        pcbX={(padIndex % 4) * 0.8 - 1.2}
        pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
      />
    )
  })

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={2}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <autoroutingphase
        autorouter="fanout"
        busFanoutDirections={{ DATA: { direction: "center_right" } }}
        fanoutBoundaryPadding={{ right: "1.2mm" }}
      />
      <chip name="U1" pcbX={-4} footprint={<footprint>{bgaPads}</footprint>} />
      <bus
        name="DATA"
        connections={innerPinNumbers.map((_, busIndex) => `D${busIndex}`)}
      />
      {innerPinNumbers.map((pinNumber, busIndex) => (
        <TestResistor
          key={pinNumber}
          busIndex={busIndex}
          pcbY={busIndex * 2 - 3}
        />
      ))}
      {innerPinNumbers.map((pinNumber, busIndex) => (
        <TestTrace key={pinNumber} pinNumber={pinNumber} busIndex={busIndex} />
      ))}
      <pcbnotetext
        pcbX={0}
        pcbY={5}
        fontSize={0.5}
        text='autorouter="fanout": inner 4x4 BGA bus'
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(8)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(0)
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(4)
  expect(autoroutingPhaseIoStack[1]?.startSimpleRouteJson?.traces).toHaveLength(
    4,
  )
  expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson?.traces).toHaveLength(8)

  const u1SourceComponent = circuit.db.source_component.getWhere({
    name: "U1",
  })
  const u1PcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: u1SourceComponent?.source_component_id,
  })
  const u1PadObstacles =
    autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.obstacles.filter(
      (obstacle) =>
        obstacle.componentId === u1PcbComponent?.pcb_component_id &&
        obstacle.connectedTo.length > 0,
    ) ?? []
  const expectedRightBoundary =
    Math.max(
      ...u1PadObstacles.map(
        (obstacle) => obstacle.center.x + obstacle.width / 2,
      ),
    ) + 1.2
  for (const fanoutTrace of autoroutingPhaseIoStack[0]?.endSimpleRouteJson
    ?.traces ?? []) {
    const exitPoint = fanoutTrace.route.findLast(
      (routePoint) => "x" in routePoint,
    )
    expect(exitPoint).toBeDefined()
    if (!exitPoint || !("x" in exitPoint)) {
      throw new Error("Expected the fanout trace to end at a point")
    }
    expect(exitPoint.x).toBeCloseTo(expectedRightBoundary)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouter-fanout-autorouting-srj",
    circuit,
  )
})
