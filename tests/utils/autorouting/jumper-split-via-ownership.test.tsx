import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createJumperSplitAutorouter = async (
  simpleRouteJson: SimpleRouteJson,
) => {
  const autorouter = await createBasicAutorouter(async (autorouterInput) => {
    const connection = autorouterInput.connections[0]!
    const [start, end] = connection.pointsToConnect
    const outputTraces: SimplifiedPcbTrace[] = [
      {
        type: "pcb_trace",
        pcb_trace_id: "jumper_trace",
        connection_name: connection.name,
        route: [
          {
            route_type: "wire",
            x: start!.x,
            y: start!.y,
            width: 0.15,
            layer: "top",
          },
          {
            route_type: "wire",
            x: -1,
            y: 0,
            width: 0.15,
            layer: "top",
          },
          {
            route_type: "jumper",
            start: { x: -1, y: 0 },
            end: { x: 1, y: 0 },
            footprint: "0603",
            layer: "top",
          },
          {
            route_type: "wire",
            x: 1,
            y: 0,
            width: 0.15,
            layer: "top",
          },
          {
            route_type: "wire",
            x: 2,
            y: 0,
            width: 0.15,
            layer: "top",
          },
          {
            route_type: "via",
            x: 2,
            y: 0,
            from_layer: "top",
            to_layer: "bottom",
          },
          {
            route_type: "wire",
            x: 2,
            y: 0,
            width: 0.15,
            layer: "bottom",
          },
          {
            route_type: "wire",
            x: end!.x,
            y: end!.y,
            width: 0.15,
            layer: "bottom",
          },
        ],
      },
    ]
    return outputTraces
  })(simpleRouteJson)

  return Object.assign(autorouter, {
    solver: {
      getOutputJumpers: () => [
        {
          jumper_footprint: "0603",
          center: { x: 0, y: 0 },
          orientation: "vertical",
          width: 2.8,
          height: 0.8,
          pads: [
            {
              center: { x: -1, y: 0 },
              width: 0.7,
              height: 0.7,
              layer: "top",
            },
            {
              center: { x: 1, y: 0 },
              width: 0.7,
              height: 0.7,
              layer: "top",
            },
          ],
        },
      ],
    },
  })
}

test("a via after a jumper split belongs to its containing PCB trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      layers={2}
      autorouter={{
        algorithmFn: createJumperSplitAutorouter,
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={0} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={3}
        pcbY={0}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.38}
        text="JUMPER SPLIT — VIA ON RIGHT SECTION"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={0}
        width={2.8}
        height={1.1}
        color="rgba(255,140,0,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext pcbX={0} pcbY={1} fontSize={0.32} text="JUMPER" />
      <pcbnotetext pcbX={-2} pcbY={-1} fontSize={0.3} text="SECTION 1" />
      <pcbnotetext pcbX={1.5} pcbY={-1} fontSize={0.3} text="SECTION 2 + VIA" />
      <pcbnoterect
        pcbX={2}
        pcbY={0}
        width={0.8}
        height={0.8}
        color="rgba(255,140,0,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext pcbX={2} pcbY={1} fontSize={0.32} text="OWNED VIA" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(2)
  const pcbTraceIds = pcbTraces.map((trace) => trace.pcb_trace_id)
  expect(new Set(pcbTraceIds).size).toBe(2)
  expect(pcbTraceIds).toContain("jumper_trace")
  expect(pcbTraceIds).toContain("jumper_trace__section_1")
  const jumperSourceComponent = circuit.db.source_component
    .list()
    .find((component) => component.name === "__autoplaced_jumper_0")
  expect(jumperSourceComponent).toBeDefined()
  const jumperPcbComponent = circuit.db.pcb_component
    .list()
    .find(
      (component) =>
        component.source_component_id ===
        jumperSourceComponent?.source_component_id,
    )
  expect(
    circuit.db.pcb_smtpad
      .list()
      .filter(
        (smtpad) =>
          smtpad.pcb_component_id === jumperPcbComponent?.pcb_component_id,
      ),
  ).toHaveLength(2)
  const [via] = circuit.db.pcb_via.list()
  expect(via).toBeDefined()
  expect(
    pcbTraces
      .find((trace) => trace.pcb_trace_id === via!.pcb_trace_id)
      ?.route.some(
        (point) => point.route_type === "via" && point.x === 2 && point.y === 0,
      ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
