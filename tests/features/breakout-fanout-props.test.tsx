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

test("breakout fanout props escape buses and plane nets without a phase", async () => {
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
      layers={6}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <copperpour layer="inner1" connectsTo="net.GND" />
      <copperpour layer="inner2" connectsTo="net.VCC" />
      <breakout
        name="BGA_BREAKOUT"
        width="10mm"
        height="8mm"
        fanoutRoutingLayers={["top", "inner3", "bottom"]}
        fanoutPourNetMap={{
          inner1: "GND",
          inner2: "VCC",
        }}
        busFanoutDirections={{
          GND_B2: "center_left",
          VCC_C3: "center_right",
          SIGNAL_BUS: "center_right",
        }}
      >
        <chip name="U1" footprint={<footprint>{bgaPads}</footprint>} />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <bus name="SIGNAL_BUS" connections={["SIGNAL", "SIGNAL_RETURN"]} />
        <trace name="GND_B2" from=".U1 > .pin6" to="net.GND" />
        <trace name="VCC_C3" from=".U1 > .pin11" to="net.VCC" />
        <trace name="SIGNAL" from=".U1 > .pin7" to=".R1 > .pin1" />
        <trace name="SIGNAL_RETURN" from=".U1 > .pin8" to=".R1 > .pin2" />
      </breakout>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(2)

  const fanoutInput = autoroutingPhaseIoStack[0]!.startSimpleRouteJson!
  expect(fanoutInput.buses).toEqual([
    {
      busId: "GND_B2",
      name: "GND_B2",
      connectionNames: [fanoutInput.connections[0]!.name],
      termination: { type: "plane", layer: "inner1" },
    },
    {
      busId: "VCC_C3",
      name: "VCC_C3",
      connectionNames: [fanoutInput.connections[1]!.name],
      termination: { type: "plane", layer: "inner2" },
    },
    {
      busId: "SIGNAL_BUS",
      name: "SIGNAL_BUS",
      connectionNames: fanoutInput.connections
        .slice(2)
        .map((connection) => connection.name),
    },
  ])

  const vias = circuit.db.pcb_via.list()
  expect(vias.some((via) => via.to_layer === "inner1")).toBe(true)
  expect(vias.some((via) => via.to_layer === "inner2")).toBe(true)
})
