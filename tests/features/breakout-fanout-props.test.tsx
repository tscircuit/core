import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const isPointInPolygon = (
  point: { x: number; y: number },
  vertices: Array<{ x: number; y: number }>,
) => {
  let isInside = false
  for (
    let vertexIndex = 0, previousVertexIndex = vertices.length - 1;
    vertexIndex < vertices.length;
    previousVertexIndex = vertexIndex++
  ) {
    const vertex = vertices[vertexIndex]!
    const previousVertex = vertices[previousVertexIndex]!
    if (
      vertex.y > point.y !== previousVertex.y > point.y &&
      point.x <
        ((previousVertex.x - vertex.x) * (point.y - vertex.y)) /
          (previousVertex.y - vertex.y) +
          vertex.x
    ) {
      isInside = !isInside
    }
  }
  return isInside
}

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
      <pcbnotetext
        text="Breakout shares board GND and VCC nets"
        pcbX={0}
        pcbY={4}
        fontSize="0.2mm"
        anchorAlignment="center"
      />
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
        <trace name="GND_DROP" from=".U1 > .pin6" to="net.GND" />
        <trace name="VCC_DROP" from=".U1 > .pin11" to="net.VCC" />
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
  expect(circuit.selectOne(".U1")).not.toBeNull()
  expect(circuit.selectOne(".R1")).not.toBeNull()

  const sourceNets = circuit.db.source_net.list()
  expect(sourceNets.filter((net) => net.name === "GND")).toHaveLength(1)
  expect(sourceNets.filter((net) => net.name === "VCC")).toHaveLength(1)

  const fanoutInput = autoroutingPhaseIoStack[0]!.startSimpleRouteJson!
  expect(fanoutInput.buses).toEqual([
    {
      busId: "GND_DROP",
      name: "GND_DROP",
      connectionNames: [fanoutInput.connections[0]!.name],
      termination: { type: "plane", layer: "inner1" },
    },
    {
      busId: "VCC_DROP",
      name: "VCC_DROP",
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

  const planeVias = circuit.db.pcb_via
    .list()
    .filter(
      (
        via,
      ): via is typeof via & { to_layer: string; pcb_trace_id: string } =>
        (via.to_layer === "inner1" || via.to_layer === "inner2") &&
        via.pcb_trace_id !== undefined,
    )
  expect(planeVias.map((via) => via.to_layer).sort()).toEqual([
    "inner1",
    "inner2",
  ])

  const pours = circuit.db.pcb_copper_pour.list()
  for (const via of planeVias) {
    const pour = pours.find((candidate) => candidate.layer === via.to_layer)
    expect(pour).toBeDefined()
    expect(pour?.shape).toBe("brep")
    if (!pour || pour.shape !== "brep") continue

    const sourceTrace = circuit.db.source_trace.get(
      via.pcb_trace_id.replace(/^fanout:/, ""),
    )
    expect(sourceTrace?.connected_source_net_ids).toContain(pour.source_net_id)
    expect(
      pour.brep_shape.inner_rings.some((ring) =>
        isPointInPolygon(via, ring.vertices),
      ),
    ).toBe(false)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
