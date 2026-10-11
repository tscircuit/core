import { expect, test } from "bun:test"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import Flatten from "@flatten-js/core"
import { renderInnerViaNetIdentityFixture } from "tests/fixtures/inner-via-net-identity.fixture"
import { renderInnerViaNetIdentitySnapshot } from "tests/fixtures/inner-via-net-identity-snapshot"

test("a real inner bridge loses VDD identity and produces false downstream errors", async () => {
  const result = await renderInnerViaNetIdentityFixture()
  const {
    circuit,
    compiledInput,
    compiledInputAfterSolve,
    nativeInput,
    nativeBridge,
    bridge,
    net,
    errors,
    pour,
  } = result
  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "rect")
  expect(
    circuit.db.source_component.list().map((component) => component.name),
  ).toEqual(["R1", "R2"])
  expect(pads).toHaveLength(4)
  expect(
    pads.map(({ shape, width, height, layer }) => ({
      shape,
      width,
      height,
      layer,
    })),
  ).toEqual(
    Array.from({ length: 4 }, () => ({
      shape: "rect",
      width: 0.8,
      height: 0.95,
      layer: "top",
    })),
  )
  // The retained TOP fanouts start at the actual compiled 0603 terminals.
  // No endpoint or fixed copper is synthesized by the native-router adapter.
  for (const fixedTrace of compiledInput.traces ?? []) {
    const pad = pads.find(
      (pad) => pad.pcb_port_id === fixedTrace.connectsTo?.[0],
    )!
    expect(fixedTrace.route[0]).toEqual({
      route_type: "wire",
      x: pad.x,
      y: pad.y,
      width: 0.1,
      layer: pad.layer,
    })
    expect(
      JSON.stringify(circuit.db.pcb_trace.get(fixedTrace.pcb_trace_id)!.route),
    ).toBe(
      JSON.stringify(
        fixedTrace.route.map((point, index) => ({
          ...point,
          ...(index === 0
            ? { start_pcb_port_id: fixedTrace.connectsTo![0] }
            : { end_pcb_port_id: fixedTrace.connectsTo![1] }),
        })),
      ),
    )
  }
  expect(compiledInput.connections[0]!.pointsToConnect).toHaveLength(4)
  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(2)
  expect(vias.map((via) => via.layers)).toEqual([
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1", "inner2", "bottom"],
  ])
  expect(
    vias.map((via) => ({ x: via.x, y: via.y, net: via.source_net_id })),
  ).toEqual([
    { x: -3, y: 0, net: net.source_net_id },
    { x: 3, y: 0, net: net.source_net_id },
  ])
  const viaPortIds = new Set(vias.flatMap((via) => via.pcb_port_ids ?? []))
  expect(compiledInputAfterSolve).toEqual(compiledInput)
  expect(nativeInput).toEqual({
    ...compiledInput,
    connections: compiledInput.connections.map((connection) => ({
      ...connection,
      pointsToConnect: connection.pointsToConnect.map((point) => {
        if (!point.pcb_port_id || !viaPortIds.has(point.pcb_port_id))
          return point
        const { layer: _layer, layers: _layers, ...viaPoint } = point
        return { ...viaPoint, layer: "inner1" }
      }),
    })),
  })
  expect(nativeBridge.connection_name).toBe(net.source_net_id)
  expect("source_trace_id" in nativeBridge).toBe(false)
  expect(nativeBridge.connectsTo).toEqual([
    vias[0]!.pcb_port_ids![0],
    vias[1]!.pcb_port_ids![0],
  ])
  expect(nativeBridge.route).toEqual([
    { route_type: "wire", x: -3, y: 0, width: 0.15, layer: "inner1" },
    { route_type: "wire", x: 3, y: 0, width: 0.15, layer: "inner1" },
  ])
  expect(JSON.stringify(bridge.route)).toBe(JSON.stringify(nativeBridge.route))
  expect(bridge.source_trace_id).toBeUndefined()
  expect(errors).toHaveLength(7)
  const messages = errors.map((error) => (error as { message: string }).message)
  expect(
    messages.filter((message) => message.includes("accidental contact")),
  ).toHaveLength(2)
  expect(
    messages.filter((message) => message.includes("accidental copper contact")),
  ).toHaveLength(1)
  expect(
    messages.filter((message) => message.includes("disconnected endpoint")),
  ).toHaveLength(2)
  expect(
    messages.filter((message) => message.includes("dangling endpoint")),
  ).toHaveLength(2)
  expect(
    errors.every(
      (error) =>
        !("pcb_trace_id" in error) ||
        error.pcb_trace_id === bridge.pcb_trace_id,
    ),
  ).toBe(true)
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(pour.source_net_id).toBe(net.source_net_id)
  expect(pour.layer).toBe("inner1")
  expect(getPourPolygon(pour).area()).toBeCloseTo(27.36, 6)
  expect(getPourPolygon(pour).contains(Flatten.point(0, 0))).toBe(true)
  await expect(
    renderInnerViaNetIdentitySnapshot(circuit.getCircuitJson(), bridge, vias),
  ).toMatchSvgSnapshot(import.meta.path, "repro-inner-via-net-identity-pcb", {
    diffThresholdPercent: 0,
  })
})
