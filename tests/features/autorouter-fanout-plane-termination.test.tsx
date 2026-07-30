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

test("fanout drops source-only power and ground connections to internal planes", async () => {
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
      width="12mm"
      height="10mm"
      layers={4}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <autoroutingphase
        autorouter="fanout"
        busFanoutDirections={{
          GND_B2_PLANE: "center_left",
          VCC_C3_PLANE: "center_right",
        }}
      />
      <chip name="U1" footprint={<footprint>{bgaPads}</footprint>} />
      <bus
        name="GND_B2_PLANE"
        connections={["GND_B2"]}
        fanoutTermination={{ type: "plane", layer: "inner1" }}
      />
      <bus
        name="VCC_C3_PLANE"
        connections={["VCC_C3"]}
        fanoutTermination={{ type: "plane", layer: "inner2" }}
      />
      <trace name="GND_B2" from=".U1 > .pin6" to="net.GND" />
      <trace name="VCC_C3" from=".U1 > .pin11" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(2)

  const fanoutInput = autoroutingPhaseIoStack[0]!.startSimpleRouteJson!
  expect(fanoutInput.connections).toHaveLength(2)
  expect(
    fanoutInput.connections.every(
      (connection) => connection.pointsToConnect.length === 1,
    ),
  ).toBe(true)
  expect(fanoutInput.buses).toEqual([
    {
      busId: "GND_B2_PLANE",
      name: "GND_B2_PLANE",
      connectionNames: [fanoutInput.connections[0]!.name],
      termination: { type: "plane", layer: "inner1" },
    },
    {
      busId: "VCC_C3_PLANE",
      name: "VCC_C3_PLANE",
      connectionNames: [fanoutInput.connections[1]!.name],
      termination: { type: "plane", layer: "inner2" },
    },
  ])
  expect(autoroutingPhaseIoStack[0]!.endSimpleRouteJson!.connections).toEqual(
    [],
  )

  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(2)
  expect(vias.map((via) => via.to_layer).toSorted()).toEqual([
    "inner1",
    "inner2",
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouter-fanout-plane-termination-srj",
    circuit,
  )
})
