import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { createBasicAutorouter } from "./createBasicAutorouter"
import { getTestFixture } from "./get-test-fixture"

/**
 * Points and copper use circuit-world mm: +X right, +Y up, +Z above the PCB.
 * The adapter selects INNER1 only for authored through-via terminal points.
 * Coordinates, terminal IDs, connection identity, fixed copper and obstacles
 * remain exactly as compiled by Core; the real Pipeline9 generates the bridge.
 */
export const renderInnerViaNetIdentityFixture = async () => {
  const { circuit } = getTestFixture()
  let compiledInput: SimpleRouteJson | undefined
  let compiledInputAfterSolve: SimpleRouteJson | undefined
  let nativeInput: SimpleRouteJson | undefined
  let nativeOutput: SimplifiedPcbTrace[] | undefined
  circuit.add(
    <board
      width={12}
      height={8}
      layers={4}
      schematicDisabled
      autorouter={{
        algorithmFn: createBasicAutorouter(async (srj) => {
          compiledInput = structuredClone(srj)
          const viaPortIds = new Set(
            circuit.db.pcb_via.list().flatMap((via) => {
              if (!via.layers.includes("inner1")) {
                throw new Error("The authored via does not reach INNER1")
              }
              return via.pcb_port_ids ?? []
            }),
          )
          const input: SimpleRouteJson = {
            ...srj,
            connections: srj.connections.map((connection) => ({
              ...connection,
              pointsToConnect: connection.pointsToConnect.map((point) => {
                if (!point.pcb_port_id || !viaPortIds.has(point.pcb_port_id)) {
                  return point
                }
                const { layer: _layer, layers: _layers, ...viaTerminal } = point
                return { ...viaTerminal, layer: "inner1" }
              }),
            })),
          }
          nativeInput = structuredClone(input)
          const router = new TscircuitAutorouter(input, {
            autorouterVersion: "beta_pipeline9",
          })
          const output = router.solveSync()
          compiledInputAfterSolve = structuredClone(srj)
          nativeOutput = structuredClone(output)
          return output
        }),
      }}
    >
      <net name="VDD" />
      {[-4, 4].map((x, index) => (
        <testpoint
          key={x}
          name={`J${index + 1}`}
          footprintVariant="pad"
          pcbX={x}
          padDiameter={0.6}
        />
      ))}
      <trace from="J1.pin1" to="V_LEFT.top" pcbStraightLine />
      <trace from="J2.pin1" to="V_RIGHT.top" pcbStraightLine />
      <via
        name="V_LEFT"
        pcbX={-3}
        outerDiameter={0.6}
        holeDiameter={0.3}
        fromLayer="top"
        toLayer="bottom"
        connectsTo="net.VDD"
      />
      <via
        name="V_RIGHT"
        pcbX={3}
        outerDiameter={0.6}
        holeDiameter={0.3}
        fromLayer="top"
        toLayer="bottom"
        connectsTo="net.VDD"
      />
      <trace from="V_LEFT.top" to="net.VDD" />
      <trace from="V_RIGHT.top" to="net.VDD" />
      <copperpour
        name="VDD_INNER"
        connectsTo="net.VDD"
        layer="inner1"
        clearance={0.2}
        outline={[
          { x: -4, y: -2 },
          { x: 4, y: -2 },
          { x: 4, y: 2 },
          { x: -4, y: 2 },
        ]}
      />
      <pcbnotetext
        text="VDD through-vias joined by real Pipeline9 on INNER1"
        pcbY={3.35}
        fontSize={0.32}
        color="#ffffff"
      />
      <pcbnotetext text="RESULT" pcbY={2.7} fontSize={0.32} color="#ffffff" />
      <pcbnotetext
        text="V_LEFT"
        pcbX={-3}
        pcbY={0.75}
        fontSize={0.3}
        color="#ffffff"
      />
      <pcbnotetext
        text="V_RIGHT"
        pcbX={3}
        pcbY={0.75}
        fontSize={0.3}
        color="#ffffff"
      />
      <pcbnotetext
        text="Actual generated VDD pour; both via barrels span all four layers"
        pcbY={-2.7}
        fontSize={0.28}
        color="#ffffff"
      />
      <pcbnotetext
        text="MEASUREMENTS"
        pcbY={-3.35}
        fontSize={0.28}
        color="#ffffff"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  if (
    !compiledInput ||
    !compiledInputAfterSolve ||
    !nativeInput ||
    !nativeOutput
  ) {
    throw new Error("The fixture did not run its real native router")
  }
  const net = circuit.db.source_net.list().find((net) => net.name === "VDD")!
  const nativeBridge = nativeOutput.find(
    (trace) => trace.connection_name === net.source_net_id,
  )!
  const bridge = circuit.db.pcb_trace.get(nativeBridge.pcb_trace_id)!
  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.endsWith("_error"))
  const wirePoints = bridge.route.filter((point) => point.route_type === "wire")
  const length = Math.hypot(
    wirePoints[1]!.x - wirePoints[0]!.x,
    wirePoints[1]!.y - wirePoints[0]!.y,
  )
  const pour = circuit.db.pcb_copper_pour.list()[0]!
  const resultNote = circuit.db.pcb_note_text
    .list()
    .find((note) => note.text === "RESULT")!
  circuit.db.pcb_note_text.update(resultNote.pcb_note_text_id, {
    text: `${bridge.source_trace_id === net.source_net_id ? "VDD owner retained" : "VDD owner lost"}: ${errors.length} ${errors.length ? "false errors" : "errors"}`,
    color: errors.length ? "#ff8888" : "#88ffbb",
  })
  const measurementsNote = circuit.db.pcb_note_text
    .list()
    .find((note) => note.text === "MEASUREMENTS")!
  circuit.db.pcb_note_text.update(measurementsNote.pcb_note_text_id, {
    text: `Bridge ${length.toFixed(2)} mm / ${wirePoints[0]!.width.toFixed(2)} mm; ${circuit.db.pcb_via.list().length} existing vias`,
  })
  return {
    circuit,
    compiledInput,
    compiledInputAfterSolve,
    nativeInput,
    nativeOutput,
    nativeBridge,
    bridge,
    net,
    errors,
    pour,
  }
}
