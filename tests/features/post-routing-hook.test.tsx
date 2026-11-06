import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("post-routing hook reads routed traces, adds footprint copper on an existing port, updates pcb_component bounds while preserving footprint_origin", async () => {
  const circuit = new RootCircuit()
  let observedTraceCountInHook = 0

  circuit.add(
    <board
      width="24mm"
      height="16mm"
      onPostRouting={(ctx) => {
        observedTraceCountInHook = ctx.pcbTraces.length

        ctx.addFootprintPrimitive(
          ".J1",
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["1"]}
            points={[
              { x: -3.5, y: -1 },
              { x: -1.5, y: -1 },
              { x: -1.5, y: 1 },
              { x: -3.5, y: 1 },
            ]}
          />,
        )
      }}
    >
      <chip
        name="J1"
        pcbX={-4}
        pcbY={0}
        pinLabels={{ pin1: "SIG", pin2: "GND" }}
        cadModel={{
          stlUrl: "https://example.com/j1.stl",
          modelOriginPosition: { x: 0, y: 0, z: 0 },
        }}
        footprint={
          <footprint>
            <platedhole
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="1.8mm"
              pcbX="0mm"
              pcbY="0mm"
              portHints={["1"]}
            />
            <platedhole
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="1.8mm"
              pcbX="0mm"
              pcbY="-3mm"
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".J1 > .SIG" to=".R1 > .pin1" />
      <trace from=".J1 > .GND" to=".R1 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(observedTraceCountInHook).toBeGreaterThan(0)

  const circuitJson = circuit.getCircuitJson()
  const j1Source = circuit.db.source_component.getWhere({ name: "J1" })!
  const j1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j1Source.source_component_id,
  })!
  const j1Cad = circuit.db.cad_component.getWhere({
    pcb_component_id: j1Pcb.pcb_component_id,
  })!

  const j1PlatedHoles = circuit.db.pcb_plated_hole.list({
    pcb_component_id: j1Pcb.pcb_component_id,
  })
  const pin1Hole = j1PlatedHoles.find((h) => h.port_hints?.includes("1"))!
  expect(pin1Hole).toBeDefined()
  expect(pin1Hole.pcb_port_id).toBeDefined()

  const j1SmtPads = circuit.db.pcb_smtpad.list({
    pcb_component_id: j1Pcb.pcb_component_id,
  })
  expect(j1SmtPads).toHaveLength(1)
  const earPad = j1SmtPads[0]!
  expect(earPad.shape).toBe("polygon")
  // Ear pad inherits pin 1's pcb_port_id
  expect(earPad.pcb_port_id).toBe(pin1Hole.pcb_port_id)

  // Before the ear pad, J1 spanned X: [-4.9, -3.1] (width 1.8) and Y: [-3.9, 0.9] (height 4.8).
  // With the polygon ear at local X [-3.5, -1.5] -> board X [-7.5, -5.5],
  // J1 now spans X: [-7.5, -3.1] (width 4.4, center.x -5.3) and Y: [-3.9, 1.0] (height 4.9, center.y -1.45).
  expect(j1Pcb.width).toBeCloseTo(4.4, 3)
  expect(j1Pcb.height).toBeCloseTo(4.9, 3)
  expect(j1Pcb.center.x).toBeCloseTo(-5.3, 3)
  expect(j1Pcb.center.y).toBeCloseTo(-1.45, 3)

  // footprint_origin and cad_component.position remain anchored on pin 1 at (-4, 0)
  expect(j1Pcb.footprint_origin).toEqual({ x: -4, y: 0 })
  expect(j1Cad.position.x).toBeCloseTo(-4, 3)
  expect(j1Cad.position.y).toBeCloseTo(0, 3)

  const drcErrors = circuitJson.filter(
    (elm) => "error_type" in elm && elm.type.startsWith("pcb_"),
  )
  expect(drcErrors).toHaveLength(0)
})

test("post-routing DRC catches a post-routing pad added too close to another net's routed trace", async () => {
  const circuit = new RootCircuit()

  circuit.addPostRoutingHook(async (ctx) => {
    const j1GndPort = ctx.selectOne(".J1 > .GND") as any
    const gndSourceTrace = ctx.db.source_trace
      .list()
      .find((st) =>
        st.connected_source_port_ids.includes(j1GndPort?.source_port_id),
      )!
    expect(gndSourceTrace).toBeDefined()

    const gndTrace = ctx.pcbTraces.find(
      (trace) => trace.source_trace_id === gndSourceTrace.source_trace_id,
    )!
    expect(gndTrace).toBeDefined()

    const wirePoints = gndTrace.route.filter((pt) => pt.route_type === "wire")
    const midPt = wirePoints[Math.floor(wirePoints.length / 2)]!
    const j1Comp = ctx.selectOne(".J1")!
    const j1Pcb = ctx.db.pcb_component.get(j1Comp.pcb_component_id!)!
    const origin = j1Pcb.footprint_origin ?? j1Pcb.center

    // Place a circle pad on pin 1 (SIG net) right on top of the GND trace
    const localX = midPt.x - origin.x
    const localY = midPt.y - origin.y

    ctx.addFootprintPrimitive(
      j1Comp,
      <smtpad
        shape="circle"
        layer="top"
        radius="0.8mm"
        pcbX={localX}
        pcbY={localY}
        portHints={["1"]}
      />,
    )
  })

  circuit.add(
    <board width="24mm" height="16mm">
      <chip
        name="J1"
        pcbX={-4}
        pcbY={0}
        pinLabels={{ pin1: "SIG", pin2: "GND" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX="0mm"
              pcbY="2mm"
              portHints={["1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX="0mm"
              pcbY="-2mm"
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".J1 > .SIG" to=".R1 > .pin1" />
      <trace from=".J1 > .GND" to=".R1 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const clearanceOrTraceErrors = circuitJson.filter(
    (elm) =>
      elm.type === "pcb_pad_trace_clearance_error" ||
      elm.type === "pcb_trace_error" ||
      elm.type === "pcb_footprint_overlap_error",
  )
  expect(clearanceOrTraceErrors.length).toBeGreaterThan(0)
})

test("post-routing hook runs before copper pour and supports component.add(<smtpad />) on rotated components", async () => {
  const circuit = new RootCircuit()
  let pourCountDuringHook = -1

  circuit.add(
    <board
      width="20mm"
      height="16mm"
      onPostRouting={(ctx) => {
        // Copper pour phase has not run yet when post-routing hook executes
        pourCountDuringHook = ctx.db.pcb_copper_pour.list().length

        const j1 = ctx.selectOne(".J1")!
        j1.add(
          <smtpad
            shape="circle"
            layer="top"
            radius="1mm"
            pcbX="2mm"
            pcbY="0mm"
            portHints={["1"]}
          />,
        )
      }}
    >
      <chip
        name="J1"
        pcbX={-4}
        pcbY={0}
        pcbRotation={90}
        pinLabels={{ pin1: "SIG", pin2: "GND" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX="0mm"
              pcbY="0mm"
              portHints={["1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX="-3mm"
              pcbY="0mm"
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <net name="GND" />
      <trace from=".J1 > .SIG" to=".R1 > .pin1" />
      <trace from=".J1 > .GND" to="net.GND" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(pourCountDuringHook).toBe(0)
  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)

  const j1Source = circuit.db.source_component.getWhere({ name: "J1" })!
  const j1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j1Source.source_component_id,
  })!
  const j1Pads = circuit.db.pcb_smtpad.list({
    pcb_component_id: j1Pcb.pcb_component_id,
  })
  const addedCirclePad = j1Pads.find((p) => p.shape === "circle")!
  expect(addedCirclePad).toBeDefined()
  if (addedCirclePad.shape === "circle") {
    // Local (2, 0) rotated 90 deg CCW around (-4, 0) is (-4, 2)
    expect(addedCirclePad.x).toBeCloseTo(-4, 3)
    expect(addedCirclePad.y).toBeCloseTo(2, 3)
  }
  expect(j1Pcb.footprint_origin).toEqual({ x: -4, y: 0 })
})
