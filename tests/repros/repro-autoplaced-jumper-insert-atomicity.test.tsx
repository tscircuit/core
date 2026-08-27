import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import {
  createAutoplacedJumperAutorouter,
  createAutoplacedJumperOutput,
  createAutoplacedJumperTraceOutput,
} from "tests/fixtures/createAutoplacedJumperAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const LAST_GOOD_JUMPER_Y = -1.2
const FAILED_REPLACEMENT_JUMPER_Y = 1.7

test("failed autoplaced jumper insertion preserves the last complete materialization", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="14mm"
      height="9mm"
      layers={1}
      autorouter={{
        algorithmFn: createAutoplacedJumperAutorouter(LAST_GOOD_JUMPER_Y),
      }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={LAST_GOOD_JUMPER_Y}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        pcbY={LAST_GOOD_JUMPER_Y}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        pcbX={0}
        pcbY={3.8}
        fontSize={0.36}
        text="FAILED INSERT — KEEP LAST COMPLETE JUMPER"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={LAST_GOOD_JUMPER_Y}
        width={3.2}
        height={1.2}
        color="rgba(40,220,100,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2.15}
        fontSize={0.3}
        text="LAST GOOD OUTPUT: PRESERVED"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={FAILED_REPLACEMENT_JUMPER_Y}
        width={3.2}
        height={1.2}
        color="rgba(255,80,80,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={2.65}
        fontSize={0.3}
        text="FAILED REPLACEMENT: ROLLED BACK"
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

  const previousMaterialization = board._autoplacedJumperMaterialization
  if (!previousMaterialization) {
    throw new Error("Expected initial jumper ownership")
  }

  const getMaterializedTableIdSets = () => ({
    sourceComponentIds: circuit.db.source_component
      .list()
      .map((element) => element.source_component_id)
      .sort(),
    sourcePortIds: circuit.db.source_port
      .list()
      .map((element) => element.source_port_id)
      .sort(),
    sourceComponentInternalConnectionIds:
      circuit.db.source_component_internal_connection
        .list()
        .map((element) => element.source_component_internal_connection_id)
        .sort(),
    pcbComponentIds: circuit.db.pcb_component
      .list()
      .map((element) => element.pcb_component_id)
      .sort(),
    pcbPortIds: circuit.db.pcb_port
      .list()
      .map((element) => element.pcb_port_id)
      .sort(),
    pcbSmtPadIds: circuit.db.pcb_smtpad
      .list()
      .map((element) => element.pcb_smtpad_id)
      .sort(),
  })
  const tableIdSetsBeforeFailedInsert = getMaterializedTableIdSets()

  const originalDb = circuit.db
  const originalPcbPortInsert = originalDb.pcb_port.insert
  let pcbPortInsertCount = 0
  const failingPcbPortTable = new Proxy(originalDb.pcb_port, {
    get(target, property, receiver) {
      if (property !== "insert") return Reflect.get(target, property, receiver)
      return (pcbPort: Parameters<typeof originalPcbPortInsert>[0]) => {
        pcbPortInsertCount++
        if (pcbPortInsertCount === 2) {
          throw new Error("intentional second PCB port insert failure")
        }
        return originalPcbPortInsert(pcbPort)
      }
    },
  })
  circuit.db = new Proxy(originalDb, {
    get(target, property, receiver) {
      if (property === "pcb_port") return failingPcbPortTable
      return Reflect.get(target, property, receiver)
    },
  })

  board._asyncAutoroutingResult = {
    output_pcb_traces: [
      createAutoplacedJumperTraceOutput({
        connectionName,
        start,
        end,
        jumperY: FAILED_REPLACEMENT_JUMPER_Y,
      }),
    ] as any,
    output_jumpers: [createAutoplacedJumperOutput(FAILED_REPLACEMENT_JUMPER_Y)],
  }
  board._markDirty("PcbTraceRender")
  try {
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      "intentional second PCB port insert failure",
    )
  } finally {
    circuit.db = originalDb
  }

  expect(pcbPortInsertCount).toBe(2)
  expect(getMaterializedTableIdSets()).toEqual(tableIdSetsBeforeFailedInsert)
  expect(board._autoplacedJumperMaterialization).toBe(previousMaterialization)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
