import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

const createDesign = (boardExtraProps: {
  schematicTraceRoutingDisabled?: boolean
}) => (
  <board width={20} height={20} routingDisabled {...boardExtraProps}>
    <chip
      name="U1"
      footprint="soic8"
      schX={0}
      schY={0}
      pinLabels={{
        pin1: "IN",
        pin2: "OUT",
        pin3: "GND",
        pin4: "VCC",
      }}
    />
    <resistor name="R1" resistance="10k" footprint="0402" schX={6} schY={0} />
    <schematicpath
      points={[
        { x: 1, y: 0 },
        { x: 5, y: 0 },
      ]}
      isFilled={false}
    />
    <schematictext text="Custom Note" schX={3} schY={2} />
    <netlabel net="VCC" connectsTo=".U1 > .pin4" schX={0} schY={3} />
    <trace from=".U1 > .pin2" to=".R1 > .pin1" schDisplayLabel="SIG_OUT" />
    <trace from=".U1 > .pin3" to="net.GND" />
  </board>
)

test("schematicTraceRoutingDisabled skips automatic schematic trace routing while keeping schematic components, ports, and user primitives", async () => {
  const { circuit: routedCircuit } = getTestFixture()
  routedCircuit.add(createDesign({}))
  await routedCircuit.renderUntilSettled()
  const routedJson = routedCircuit.getCircuitJson()

  const { circuit: unroutedCircuit } = getTestFixture()
  unroutedCircuit.add(createDesign({ schematicTraceRoutingDisabled: true }))
  await unroutedCircuit.renderUntilSettled()
  const unroutedJson = unroutedCircuit.getCircuitJson()

  // Routing on produces schematic_trace elements
  expect(
    routedJson.filter((e) => e.type === "schematic_trace").length,
  ).toBeGreaterThan(0)

  // Routing disabled produces 0 schematic_trace elements and 0 trace display labels
  expect(unroutedJson.filter((e) => e.type === "schematic_trace")).toHaveLength(
    0,
  )
  expect(
    unroutedJson.filter(
      (e) =>
        e.type === "schematic_text" &&
        "source_trace_id" in e &&
        Boolean(e.source_trace_id),
    ),
  ).toHaveLength(0)

  // Schematic components, ports (positions and sides), user schematic primitives, source_traces, and PCB elements remain intact
  expect(
    unroutedJson.filter((e) => e.type === "schematic_component").length,
  ).toBe(routedJson.filter((e) => e.type === "schematic_component").length)

  const routedPorts = routedJson
    .filter((e) => e.type === "schematic_port")
    .map(({ is_connected, ...rest }: any) => rest)
  const unroutedPorts = unroutedJson
    .filter((e) => e.type === "schematic_port")
    .map(({ is_connected, ...rest }: any) => rest)
  expect(unroutedPorts).toEqual(routedPorts)

  expect(
    unroutedJson.filter((e) => e.type === "schematic_path").length,
  ).toBeGreaterThan(0)
  expect(
    unroutedJson.filter(
      (e) => e.type === "schematic_text" && (e as any).text === "Custom Note",
    ),
  ).toHaveLength(1)
  expect(unroutedJson.filter((e) => e.type === "source_trace").length).toBe(
    routedJson.filter((e) => e.type === "source_trace").length,
  )
  expect(unroutedJson.filter((e) => e.type === "pcb_component").length).toBe(
    routedJson.filter((e) => e.type === "pcb_component").length,
  )
})

test("schematicTraceRoutingDisabled precedence: circuit override -> platform -> board prop, and per-trace router fallback", async () => {
  // 1. Platform config disables schematic trace routing
  const { circuit: platformCircuit } = getTestFixture({
    platform: { schematicTraceRoutingDisabled: true } as any,
  })
  platformCircuit._featureMspSchematicTraceRouting = false
  platformCircuit.add(createDesign({}))
  await platformCircuit.renderUntilSettled()
  expect(
    platformCircuit
      .getCircuitJson()
      .filter((e) => e.type === "schematic_trace"),
  ).toHaveLength(0)

  // 2. Circuit override takes precedence over platform and board prop
  const { circuit: overrideCircuit } = getTestFixture({
    platform: { schematicTraceRoutingDisabled: true } as any,
  })
  overrideCircuit.schematicTraceRoutingDisabled = false
  overrideCircuit.add(createDesign({ schematicTraceRoutingDisabled: true }))
  await overrideCircuit.renderUntilSettled()
  expect(
    overrideCircuit.getCircuitJson().filter((e) => e.type === "schematic_trace")
      .length,
  ).toBeGreaterThan(0)
})
