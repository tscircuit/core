import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const INITIAL_JUMPER_Y = -0.8
const REPLACEMENT_JUMPER_Y = 1.4

const createJumperOutput = (y: number) => ({
  jumper_footprint: "0603",
  center: { x: 0, y },
  orientation: "vertical",
  width: 2.8,
  height: 0.8,
  pads: [
    {
      center: { x: -1, y },
      width: 0.7,
      height: 0.7,
      layer: "top",
    },
    {
      center: { x: 1, y },
      width: 0.7,
      height: 0.7,
      layer: "top",
    },
  ],
})

const createTraceOutput = ({
  connectionName,
  start,
  end,
  jumperY,
}: {
  connectionName: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  jumperY: number
}): SimplifiedPcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: "autoplaced_jumper_trace",
  connection_name: connectionName,
  route: [
    {
      route_type: "wire",
      x: start.x,
      y: start.y,
      width: 0.15,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -1,
      y: jumperY,
      width: 0.15,
      layer: "top",
    },
    {
      route_type: "jumper",
      start: { x: -1, y: jumperY },
      end: { x: 1, y: jumperY },
      footprint: "0603",
      layer: "top",
    },
    {
      route_type: "wire",
      x: 1,
      y: jumperY,
      width: 0.15,
      layer: "top",
    },
    {
      route_type: "wire",
      x: end.x,
      y: end.y,
      width: 0.15,
      layer: "top",
    },
  ],
})

const createAutoplacedJumperAutorouter = async (
  simpleRouteJson: SimpleRouteJson,
) => {
  const autorouter = await createBasicAutorouter(async (autorouterInput) => {
    const connection = autorouterInput.connections[0]!
    const [start, end] = connection.pointsToConnect
    return [
      createTraceOutput({
        connectionName: connection.name,
        start: start!,
        end: end!,
        jumperY: INITIAL_JUMPER_Y,
      }),
    ]
  })(simpleRouteJson)

  return Object.assign(autorouter, {
    solver: {
      getOutputJumpers: () => [createJumperOutput(INITIAL_JUMPER_Y)],
    },
  })
}

test("dirty PCB trace rerender leaves stale autoplaced jumper elements", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="14mm"
      height="10mm"
      layers={1}
      autorouter={{ algorithmFn: createAutoplacedJumperAutorouter }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={1.4}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        pcbY={1.4}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <jumper name="J1" pinCount={2} footprint="0402" pcbX={0} pcbY={-3.5} />
      <pcbnotetext
        pcbX={0}
        pcbY={4.35}
        fontSize={0.38}
        text="DIRTY RERENDER — REPLACE AUTOPLACED JUMPER"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={REPLACEMENT_JUMPER_Y}
        width={3.2}
        height={1.2}
        color="rgba(40,220,100,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={2.35}
        fontSize={0.3}
        text="REPLACEMENT: KEEP ONE"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={INITIAL_JUMPER_Y}
        width={3.2}
        height={1.2}
        color="rgba(255,80,80,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-1.7}
        fontSize={0.3}
        text="OLD OUTPUT: MUST DISAPPEAR"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4.6}
        fontSize={0.3}
        text="USER JUMPER: MUST STAY"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Group
  const initialTrace = board._asyncAutoroutingResult?.output_pcb_traces?.find(
    (element) => element.type === "pcb_trace",
  )
  if (!initialTrace) throw new Error("Expected initial autorouter trace output")

  const initialWirePoints = initialTrace.route.filter(
    (point) => point.route_type === "wire",
  )
  const start = initialWirePoints[0]!
  const end = initialWirePoints.at(-1)!
  const connectionName = (initialTrace as SimplifiedPcbTrace).connection_name
  if (!connectionName) throw new Error("Expected routed connection name")

  const userSourceComponent = circuit.db.source_component.getWhere({
    name: "J1",
  })!
  const userPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: userSourceComponent.source_component_id,
  })!
  const reservedPrefixUserSourceComponent = circuit.db.source_component.insert({
    ftype: "simple_chip",
    name: "__autoplaced_jumper_user_owned",
    supplier_part_numbers: {},
  })

  board._asyncAutoroutingResult = {
    output_pcb_traces: [
      createTraceOutput({
        connectionName,
        start,
        end,
        jumperY: REPLACEMENT_JUMPER_Y,
      }),
    ] as any,
    output_jumpers: [createJumperOutput(REPLACEMENT_JUMPER_Y)],
  }
  board._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()

  const autoplacedSourceComponents = circuit.db.source_component
    .list()
    .filter((component) => component.name === "__autoplaced_jumper_0")
  expect(autoplacedSourceComponents).toHaveLength(2)
  const autoplacedSourceComponentIds = new Set(
    autoplacedSourceComponents.map(
      (component) => component.source_component_id,
    ),
  )

  const autoplacedPcbComponents = circuit.db.pcb_component
    .list()
    .filter((component) =>
      autoplacedSourceComponentIds.has(component.source_component_id!),
    )
  expect(autoplacedPcbComponents.map((component) => component.center)).toEqual([
    { x: 0, y: INITIAL_JUMPER_Y },
    { x: 0, y: REPLACEMENT_JUMPER_Y },
  ])
  const replacementPcbComponent = autoplacedPcbComponents.find(
    (component) => component.center.y === REPLACEMENT_JUMPER_Y,
  )!

  const autoplacedSourcePorts = circuit.db.source_port
    .list()
    .filter((port) =>
      autoplacedSourceComponentIds.has(port.source_component_id!),
    )
  expect(autoplacedSourcePorts).toHaveLength(4)
  expect(
    circuit.db.source_component_internal_connection
      .list()
      .filter((connection) =>
        autoplacedSourceComponentIds.has(connection.source_component_id),
      ),
  ).toHaveLength(2)

  const autoplacedPcbPorts = circuit.db.pcb_port.list({
    pcb_component_id: replacementPcbComponent.pcb_component_id,
  })
  expect(autoplacedPcbPorts).toHaveLength(2)
  expect(
    circuit.db.pcb_smtpad
      .list()
      .filter((pad) =>
        autoplacedPcbComponents.some(
          (component) => component.pcb_component_id === pad.pcb_component_id,
        ),
      ),
  ).toHaveLength(4)

  const autoplacedPcbPortIds = new Set(
    autoplacedPcbPorts.map((port) => port.pcb_port_id),
  )
  const tracesConnectedToReplacementJumper = circuit.db.pcb_trace
    .list()
    .filter((trace) =>
      trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          ((point.start_pcb_port_id &&
            autoplacedPcbPortIds.has(point.start_pcb_port_id)) ||
            (point.end_pcb_port_id &&
              autoplacedPcbPortIds.has(point.end_pcb_port_id))),
      ),
    )
  expect(tracesConnectedToReplacementJumper).toHaveLength(2)

  expect(
    circuit.db.source_component.get(userSourceComponent.source_component_id),
  ).toBeDefined()
  expect(
    circuit.db.pcb_component.get(userPcbComponent.pcb_component_id),
  ).toBeDefined()
  expect(
    circuit.db.source_component.get(
      reservedPrefixUserSourceComponent.source_component_id,
    ),
  ).toBeDefined()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
