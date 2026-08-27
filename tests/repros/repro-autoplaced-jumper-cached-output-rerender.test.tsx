import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { addPortIdsToTracesAtJumperPads } from "lib/components/primitive-components/Group/add-port-ids-to-traces-at-jumper-pads"
import { createAutoplacedJumperAutorouter } from "tests/fixtures/createAutoplacedJumperAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const JUMPER_Y = 0.7

test("cached jumper output reconnects to new ports and empty output removes it", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="14mm"
      height="9mm"
      layers={1}
      autorouter={{
        algorithmFn: createAutoplacedJumperAutorouter(JUMPER_Y, {
          omitPcbTraceId: true,
        }),
      }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={JUMPER_Y}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        pcbY={JUMPER_Y}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <jumper name="J1" pinCount={2} footprint="0402" pcbX={0} pcbY={-2.7} />
      <pcbnotetext
        pcbX={0}
        pcbY={3.8}
        fontSize={0.36}
        text="REPEATED CACHED RERENDERS + EMPTY OUTPUT"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={JUMPER_Y}
        width={3.2}
        height={1.2}
        color="rgba(255,80,80,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={1.65}
        fontSize={0.3}
        text="REPEATED EMPTY OUTPUT: AUTO JUMPER REMOVED"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={-2.7}
        width={2.2}
        height={1.2}
        color="rgba(40,220,100,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.65}
        fontSize={0.3}
        text="USER JUMPER: KEPT"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Group
  const cachedAutoroutingResult = board._asyncAutoroutingResult
  const cachedTrace = cachedAutoroutingResult?.output_pcb_traces?.find(
    (element) => element.type === "pcb_trace",
  )
  if (!cachedAutoroutingResult || !cachedTrace) {
    throw new Error("Expected cached autorouter output")
  }

  const firstMaterialization = board._autoplacedJumperMaterialization
  if (!firstMaterialization) {
    throw new Error("Expected initial jumper ownership")
  }
  const firstPcbPortIds = new Set(firstMaterialization.pcbPortIds)
  const [reusedPcbPortId, missingPcbPortId] = [...firstPcbPortIds]
  if (!reusedPcbPortId || !missingPcbPortId) {
    throw new Error("Expected two initial autoplaced jumper ports")
  }
  const cachedWirePoints = cachedTrace.route.filter(
    (point) => point.route_type === "wire",
  )
  const cachedRouteStart = cachedWirePoints[0]!
  const cachedLeftJumperWirePoint = cachedWirePoints.find(
    (point) => point.x === -1 && point.y === JUMPER_Y,
  )!
  const sourceTraceId = circuit.db.source_trace.list()[0]?.source_trace_id
  if (sourceTraceId) {
    cachedTrace.source_trace_id = sourceTraceId
  }

  const userSourceComponent = circuit.db.source_component.getWhere({
    name: "J1",
  })!
  const userPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: userSourceComponent.source_component_id,
  })!
  const userSourcePort = circuit.db.source_port.list({
    source_component_id: userSourceComponent.source_component_id,
  })[0]!
  const reusedOwnedPcbPort = circuit.db.pcb_port.get(reusedPcbPortId)!
  circuit.db.pcb_port.delete(reusedPcbPortId)
  const userOwnedPcbPortWithReusedIdInput: Parameters<
    typeof circuit.db.pcb_port.insert
  >[0] & { pcb_port_id: string } = {
    ...reusedOwnedPcbPort,
    pcb_port_id: reusedPcbPortId,
    pcb_component_id: userPcbComponent.pcb_component_id,
    source_port_id: userSourcePort.source_port_id,
    x: cachedRouteStart.x,
    y: cachedRouteStart.y,
  }
  const userOwnedPcbPortWithReusedId = circuit.db.pcb_port.insert(
    userOwnedPcbPortWithReusedIdInput,
  )
  circuit.db.pcb_port.delete(missingPcbPortId)

  cachedRouteStart.start_pcb_port_id = reusedPcbPortId
  cachedLeftJumperWirePoint.end_pcb_port_id = missingPcbPortId
  const cachedRouteBeforeRerender = structuredClone(cachedTrace.route)

  cachedAutoroutingResult.pcb_trace_ids_to_be_replaced = circuit.db.pcb_trace
    .list()
    .map((trace) => trace.pcb_trace_id)
  board._markDirty("PcbTraceRender")
  const originalDb = circuit.db
  circuit.db = new Proxy(originalDb, {})
  try {
    await circuit.renderUntilSettled()
  } finally {
    circuit.db = originalDb
  }

  const secondMaterialization = board._autoplacedJumperMaterialization
  if (!secondMaterialization) {
    throw new Error("Expected replacement jumper ownership")
  }
  const secondPcbPortIds = new Set(secondMaterialization.pcbPortIds)
  expect(secondMaterialization).not.toBe(firstMaterialization)
  expect(cachedTrace.route).toEqual(cachedRouteBeforeRerender)
  expect(userOwnedPcbPortWithReusedId.pcb_port_id).toBe(reusedPcbPortId)
  expect(
    circuit.db.pcb_port.get(userOwnedPcbPortWithReusedId.pcb_port_id),
  ).toBe(userOwnedPcbPortWithReusedId)

  const tracesConnectedToSecondMaterialization = circuit.db.pcb_trace
    .list()
    .filter((trace) =>
      trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          ((point.start_pcb_port_id &&
            secondPcbPortIds.has(point.start_pcb_port_id)) ||
            (point.end_pcb_port_id &&
              secondPcbPortIds.has(point.end_pcb_port_id))),
      ),
    )
  expect(tracesConnectedToSecondMaterialization).toHaveLength(2)
  const secondPcbPortIdsReferencedByTraces = new Set(
    tracesConnectedToSecondMaterialization.flatMap((trace) =>
      trace.route.flatMap((point) =>
        point.route_type === "wire"
          ? [point.start_pcb_port_id, point.end_pcb_port_id].filter(
              (pcbPortId): pcbPortId is string =>
                Boolean(pcbPortId && secondPcbPortIds.has(pcbPortId)),
            )
          : [],
      ),
    ),
  )
  expect(secondPcbPortIdsReferencedByTraces).toEqual(secondPcbPortIds)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            (point.start_pcb_port_id === missingPcbPortId ||
              point.end_pcb_port_id === missingPcbPortId),
        ),
      ),
  ).toBe(false)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            (point.start_pcb_port_id === reusedPcbPortId ||
              point.end_pcb_port_id === reusedPcbPortId),
        ),
      ),
  ).toBe(true)

  const routeWithVia: PcbTrace["route"] = [
    {
      route_type: "wire",
      x: 20,
      y: 20,
      width: 0.15,
      layer: "top",
      start_pcb_port_id: missingPcbPortId,
    },
    {
      route_type: "via",
      x: 21,
      y: 20,
      from_layer: "top",
      to_layer: "bottom",
    },
  ]
  const viaRoutePoint = routeWithVia[1]
  const [processedRouteWithVia] = addPortIdsToTracesAtJumperPads(
    [routeWithVia],
    circuit.db,
    secondPcbPortIds,
  )
  expect(processedRouteWithVia![0]).not.toBe(routeWithVia[0])
  expect(processedRouteWithVia![0]).not.toHaveProperty("start_pcb_port_id")
  expect(processedRouteWithVia![1]).toBe(viaRoutePoint)

  const secondPcbPorts = [...secondPcbPortIds]
    .map((pcbPortId) => circuit.db.pcb_port.get(pcbPortId)!)
    .sort((a, b) => a.x - b.x)
  const emptyOutputTrace = cachedTrace
  const emptyOutputLeftJumperWirePoint = emptyOutputTrace.route.find(
    (point) =>
      point.route_type === "wire" && point.x === -1 && point.y === JUMPER_Y,
  )
  const emptyOutputRightJumperWirePoint = emptyOutputTrace.route.find(
    (point) =>
      point.route_type === "wire" && point.x === 1 && point.y === JUMPER_Y,
  )
  if (
    emptyOutputLeftJumperWirePoint?.route_type !== "wire" ||
    emptyOutputRightJumperWirePoint?.route_type !== "wire"
  ) {
    throw new Error("Expected cached jumper endpoint wire points")
  }
  emptyOutputLeftJumperWirePoint.start_pcb_port_id =
    secondPcbPorts[0]!.pcb_port_id
  emptyOutputRightJumperWirePoint.start_pcb_port_id =
    secondPcbPorts[1]!.pcb_port_id
  const emptyOutputRouteWithStalePortIds = structuredClone(
    emptyOutputTrace.route,
  )

  board._asyncAutoroutingResult = {
    ...cachedAutoroutingResult,
    output_pcb_traces: [emptyOutputTrace],
    output_jumpers: [],
    pcb_trace_ids_to_be_replaced: circuit.db.pcb_trace
      .list()
      .map((trace) => trace.pcb_trace_id),
  }
  board._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()

  expect(board._autoplacedJumperMaterialization).toBeNull()
  expect(emptyOutputTrace.route).toEqual(emptyOutputRouteWithStalePortIds)
  expect(
    circuit.db.source_component
      .list()
      .filter((component) => component.name === "__autoplaced_jumper_0"),
  ).toHaveLength(0)
  expect(
    [...secondMaterialization.sourceComponentIds].every(
      (sourceComponentId) =>
        !circuit.db.source_component.get(sourceComponentId),
    ),
  ).toBe(true)
  expect(
    [...secondMaterialization.sourcePortIds].every(
      (sourcePortId) => !circuit.db.source_port.get(sourcePortId),
    ),
  ).toBe(true)
  expect(
    [...secondMaterialization.sourceComponentInternalConnectionIds].every(
      (internalConnectionId) =>
        !circuit.db.source_component_internal_connection.get(
          internalConnectionId,
        ),
    ),
  ).toBe(true)
  expect(
    [...secondMaterialization.pcbComponentIds].every(
      (pcbComponentId) => !circuit.db.pcb_component.get(pcbComponentId),
    ),
  ).toBe(true)
  expect(
    [...secondMaterialization.pcbPortIds].every(
      (pcbPortId) => !circuit.db.pcb_port.get(pcbPortId),
    ),
  ).toBe(true)
  expect(
    [...secondMaterialization.pcbSmtPadIds].every(
      (pcbSmtPadId) => !circuit.db.pcb_smtpad.get(pcbSmtPadId),
    ),
  ).toBe(true)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            ((point.start_pcb_port_id &&
              secondPcbPortIds.has(point.start_pcb_port_id)) ||
              (point.end_pcb_port_id &&
                secondPcbPortIds.has(point.end_pcb_port_id))),
        ),
      ),
  ).toBe(false)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            (point.start_pcb_port_id === missingPcbPortId ||
              point.end_pcb_port_id === missingPcbPortId),
        ),
      ),
  ).toBe(false)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            (point.start_pcb_port_id === reusedPcbPortId ||
              point.end_pcb_port_id === reusedPcbPortId),
        ),
      ),
  ).toBe(true)
  expect(
    circuit.db.pcb_port.get(userOwnedPcbPortWithReusedId.pcb_port_id),
  ).toBe(userOwnedPcbPortWithReusedId)
  expect(
    circuit.db.source_component.get(userSourceComponent.source_component_id),
  ).toBeDefined()

  board._asyncAutoroutingResult!.pcb_trace_ids_to_be_replaced =
    circuit.db.pcb_trace.list().map((trace) => trace.pcb_trace_id)
  board._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()

  expect(board._autoplacedJumperMaterialization).toBeNull()
  expect(emptyOutputTrace.route).toEqual(emptyOutputRouteWithStalePortIds)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            ((point.start_pcb_port_id &&
              secondPcbPortIds.has(point.start_pcb_port_id)) ||
              (point.end_pcb_port_id &&
                secondPcbPortIds.has(point.end_pcb_port_id)) ||
              point.start_pcb_port_id === missingPcbPortId ||
              point.end_pcb_port_id === missingPcbPortId),
        ),
      ),
  ).toBe(false)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            (point.start_pcb_port_id === reusedPcbPortId ||
              point.end_pcb_port_id === reusedPcbPortId),
        ),
      ),
  ).toBe(true)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
