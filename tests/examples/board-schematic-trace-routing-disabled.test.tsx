import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
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
  expect(routedCircuit.schematicTraceRoutingDisabled).toBe(false)
  routedCircuit.add(createDesign({}))
  await routedCircuit.renderUntilSettled()
  const routedJson = routedCircuit.getCircuitJson()

  const { circuit: unroutedCircuit } = getTestFixture()
  unroutedCircuit.add(createDesign({ schematicTraceRoutingDisabled: true }))
  await unroutedCircuit.renderUntilSettled()
  expect(unroutedCircuit.schematicTraceRoutingDisabled).toBe(true)
  const unroutedJson = unroutedCircuit.getCircuitJson()

  // Routing enabled produces schematic_trace elements and auto-placed GND net label
  expect(
    routedJson.filter((e) => e.type === "schematic_trace").length,
  ).toBeGreaterThan(0)
  expect(
    routedJson.filter(
      (e) => e.type === "schematic_net_label" && e.text === "GND",
    ).length,
  ).toBeGreaterThan(0)

  // Routing disabled produces 0 schematic_trace elements, 0 auto-placed net labels, and 0 trace display labels
  expect(unroutedJson.filter((e) => e.type === "schematic_trace")).toHaveLength(
    0,
  )
  expect(
    unroutedJson.filter(
      (e) => e.type === "schematic_net_label" && e.text === "GND",
    ),
  ).toHaveLength(0)
  expect(
    unroutedJson.filter(
      (e) => e.type === "schematic_net_label" && e.text === "VCC",
    ),
  ).toHaveLength(1)
  expect(
    unroutedJson.filter(
      (e) =>
        e.type === "schematic_text" &&
        "source_trace_id" in e &&
        Boolean(e.source_trace_id),
    ),
  ).toHaveLength(0)

  // Schematic components, port positions/sides, user schematic primitives, source_* elements, and PCB elements remain intact
  expect(
    unroutedJson.filter((e) => e.type === "schematic_component").length,
  ).toBe(routedJson.filter((e) => e.type === "schematic_component").length)

  const stripPortConnectionState = ({ is_connected, ...rest }: any) => rest
  expect(
    unroutedJson
      .filter((e) => e.type === "schematic_port")
      .map(stripPortConnectionState),
  ).toEqual(
    routedJson
      .filter((e) => e.type === "schematic_port")
      .map(stripPortConnectionState),
  )

  expect(
    unroutedJson.filter((e) => e.type === "schematic_path").length,
  ).toBeGreaterThan(0)
  expect(
    unroutedJson.filter(
      (e) => e.type === "schematic_text" && e.text === "Custom Note",
    ),
  ).toHaveLength(1)
  expect(unroutedJson.filter((e) => e.type === "source_trace").length).toBe(
    routedJson.filter((e) => e.type === "source_trace").length,
  )
  expect(unroutedJson.filter((e) => e.type === "pcb_component").length).toBe(
    routedJson.filter((e) => e.type === "pcb_component").length,
  )
})

test("schematicTraceRoutingDisabled precedence: circuit override -> platform -> board prop", async () => {
  // 1. Platform config disables schematic trace routing when board prop is unset
  const platformDisabledCircuit = new RootCircuit({
    platform: { schematicTraceRoutingDisabled: true },
  })
  platformDisabledCircuit.add(createDesign({}))
  await platformDisabledCircuit.renderUntilSettled()
  expect(
    platformDisabledCircuit
      .getCircuitJson()
      .filter((e) => e.type === "schematic_trace"),
  ).toHaveLength(0)

  // 2. Explicit platform config (= false) takes precedence over board prop (= true)
  const platformEnabledCircuit = new RootCircuit({
    platform: { schematicTraceRoutingDisabled: false },
  })
  platformEnabledCircuit.add(
    createDesign({ schematicTraceRoutingDisabled: true }),
  )
  await platformEnabledCircuit.renderUntilSettled()
  expect(
    platformEnabledCircuit
      .getCircuitJson()
      .filter((e) => e.type === "schematic_trace").length,
  ).toBeGreaterThan(0)

  // 3. Circuit override takes precedence over both platform and board prop
  const overrideEnabledCircuit = new RootCircuit({
    platform: { schematicTraceRoutingDisabled: true },
  })
  overrideEnabledCircuit.schematicTraceRoutingDisabled = false
  overrideEnabledCircuit.add(
    createDesign({ schematicTraceRoutingDisabled: true }),
  )
  await overrideEnabledCircuit.renderUntilSettled()
  expect(
    overrideEnabledCircuit
      .getCircuitJson()
      .filter((e) => e.type === "schematic_trace").length,
  ).toBeGreaterThan(0)
})

test("schematicTraceRoutingDisabled skips per-trace router on multi-port traces and propagates to isolated subcircuits", async () => {
  // Legacy per-trace router (_featureMspSchematicTraceRouting = false) throws on 3+ port traces unless skipped
  const { circuit: multiPortCircuit } = getTestFixture()
  multiPortCircuit._featureMspSchematicTraceRouting = false
  multiPortCircuit.add(
    <board width={20} height={20} routingDisabled schematicTraceRoutingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" schX={0} schY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" schX={4} schY={0} />
      <resistor name="R3" resistance="1k" footprint="0402" schX={8} schY={0} />
      <trace
        path={[".R1 > .pin1", ".R2 > .pin1", ".R3 > .pin1"]}
        schDisplayLabel="MULTI"
      />
    </board>,
  )
  await multiPortCircuit.renderUntilSettled()
  const multiPortJson = multiPortCircuit.getCircuitJson()
  expect(
    multiPortJson.filter((e) => e.type === "schematic_trace"),
  ).toHaveLength(0)
  expect(
    multiPortJson.filter((e) => e.type === "source_trace").length,
  ).toBeGreaterThan(0)

  // Isolated cached subcircuit inherits schematicTraceRoutingDisabled from parent root
  const { circuit: subcircuitRoot } = getTestFixture()
  subcircuitRoot.add(
    <board width={30} height={20} routingDisabled schematicTraceRoutingDisabled>
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          schX={0}
          schY={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          schX={4}
          schY={0}
        />
        <trace from=".R1 > .pin2" to=".C1 > .pin1" />
      </subcircuit>
    </board>,
  )
  await subcircuitRoot.renderUntilSettled()
  expect(subcircuitRoot.cachedSubcircuits?.size).toBe(1)
  const subcircuitJson = subcircuitRoot.getCircuitJson()
  expect(
    subcircuitJson.filter((e) => e.type === "schematic_trace"),
  ).toHaveLength(0)
  expect(
    subcircuitJson.filter((e) => e.type === "schematic_component"),
  ).toHaveLength(2)
})
