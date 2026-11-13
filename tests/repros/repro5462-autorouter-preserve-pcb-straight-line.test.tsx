import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const segmentDistance = (
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number },
): number => {
  const orient = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    r: { x: number; y: number },
  ) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)

  const onSegment = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    r: { x: number; y: number },
  ) =>
    q.x <= Math.max(p.x, r.x) + 1e-9 &&
    q.x >= Math.min(p.x, r.x) - 1e-9 &&
    q.y <= Math.max(p.y, r.y) + 1e-9 &&
    q.y >= Math.min(p.y, r.y) - 1e-9

  const o1 = orient(a1, a2, b1)
  const o2 = orient(a1, a2, b2)
  const o3 = orient(b1, b2, a1)
  const o4 = orient(b1, b2, a2)

  if (
    ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) &&
    ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))
  ) {
    return 0
  }
  if (Math.abs(o1) < 1e-9 && onSegment(a1, b1, a2)) return 0
  if (Math.abs(o2) < 1e-9 && onSegment(a1, b2, a2)) return 0
  if (Math.abs(o3) < 1e-9 && onSegment(b1, a1, b2)) return 0
  if (Math.abs(o4) < 1e-9 && onSegment(b1, a2, b2)) return 0

  const pointToSeg = (
    p: { x: number; y: number },
    s1: { x: number; y: number },
    s2: { x: number; y: number },
  ) => {
    const dx = s2.x - s1.x
    const dy = s2.y - s1.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(p.x - s1.x, p.y - s1.y)
    const t = Math.max(
      0,
      Math.min(1, ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / lenSq),
    )
    return Math.hypot(p.x - (s1.x + t * dx), p.y - (s1.y + t * dy))
  }

  return Math.min(
    pointToSeg(a1, b1, b2),
    pointToSeg(a2, b1, b2),
    pointToSeg(b1, a1, a2),
    pointToSeg(b2, a1, a2),
  )
}

test("repro5462: autorouter preserves pcbStraightLine trace without replacing or adding vias", async () => {
  const { circuit } = getTestFixture()
  let initialStraightTrace: PcbTrace | undefined

  circuit.on("autorouting:start", () => {
    initialStraightTrace ??= structuredClone(circuit.db.pcb_trace.list()[0])
  })

  circuit.add(
    <board width="20mm" height="12mm">
      <chip name="U1" footprint="soic8" pcbX={-4} pcbY={0} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={1}
        pcbY={1.905}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={4}
        pcbY={4}
      />
      <trace from="U1.pin8" to="R1.pin1" pcbStraightLine />
      <trace from="U1.pin7" to="C1.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(initialStraightTrace).toBeDefined()
  expect(initialStraightTrace!.route).toHaveLength(2)

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(2)

  const preservedTrace = circuit.db.pcb_trace.get(
    initialStraightTrace!.pcb_trace_id,
  )
  expect(preservedTrace).toBeDefined()
  expect(preservedTrace!.route).toEqual(initialStraightTrace!.route)
  expect(
    preservedTrace!.route.every(
      (pt) => pt.route_type === "wire" && pt.layer === "top",
    ),
  ).toBe(true)

  for (const trace of traces) {
    expect((trace as any).__replaces_pcb_trace_id).toBeUndefined()
  }

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("repro5462: pcbStraightLine escapes stay fixed without shorting on board with unbroken bottom copperpour and simplify phase", async () => {
  const { circuit } = getTestFixture()
  let initialManualTraces: PcbTrace[] | undefined

  circuit.on("autorouting:start", () => {
    initialManualTraces ??= structuredClone(circuit.db.pcb_trace.list())
  })

  circuit.add(
    <board
      width="24mm"
      height="16mm"
      layers={2}
      schematicDisabled
      routeRemaining
    >
      <net name="GND" />
      <copperpour layer="bottom" connectsTo="net.GND" unbroken />
      <chip
        name="J1"
        pcbX={-5}
        pcbY={0}
        pinLabels={{
          pin5: "GND",
          pin6: "VBUS",
          pin7: "CC2",
          pin8: "CC1",
        }}
        footprint="soic8"
      />
      <resistor
        name="R_CC1"
        resistance="5.1k"
        footprint="0402"
        pcbX={1}
        pcbY={1.905}
      />
      <resistor
        name="R_CC2"
        resistance="5.1k"
        footprint="0402"
        pcbX={1}
        pcbY={0.635}
        pcbRotation={0}
      />
      <capacitor
        name="C_VBUS"
        capacitance="1uF"
        footprint="0402"
        pcbX={5}
        pcbY={4.5}
      />
      <trace from="J1.CC1" to="R_CC1.pin1" pcbStraightLine />
      <trace from="J1.CC2" to="R_CC2.pin1" pcbStraightLine />
      <trace from="J1.VBUS" to="C_VBUS.pin1" />
      <autoroutingphase phaseIndex={1} reroute autorouter="simplify" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(initialManualTraces).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  const allTraces = circuit.db.pcb_trace.list()
  for (const original of initialManualTraces!) {
    const after = circuit.db.pcb_trace.get(original.pcb_trace_id)
    expect(after).toBeDefined()
    expect(after!.route).toEqual(original.route)
    expect(after!.route).toHaveLength(2)
    expect(
      after!.route.every(
        (pt) => pt.route_type === "wire" && pt.layer === "top",
      ),
    ).toBe(true)
  }

  const manualIds = new Set(initialManualTraces!.map((t) => t.pcb_trace_id))
  const vbusTraces = allTraces.filter((t) => !manualIds.has(t.pcb_trace_id))
  expect(vbusTraces.length).toBeGreaterThanOrEqual(1)

  for (const manualTrace of initialManualTraces!) {
    const [mStart, mEnd] = manualTrace.route
    if (mStart?.route_type !== "wire" || mEnd?.route_type !== "wire") continue
    for (const otherTrace of vbusTraces) {
      if (otherTrace.source_trace_id === manualTrace.source_trace_id) continue
      for (let i = 0; i < otherTrace.route.length - 1; i++) {
        const p1 = otherTrace.route[i]!
        const p2 = otherTrace.route[i + 1]!
        if (
          p1.route_type === "wire" &&
          p2.route_type === "wire" &&
          p1.layer === "top" &&
          p2.layer === "top"
        ) {
          const centerDist = segmentDistance(mStart, mEnd, p1, p2)
          const copperGap = centerDist - (mStart.width + p1.width) / 2
          expect(copperGap).toBeGreaterThan(0.05)
        }
      }
    }
  }
})

test("repro5462: autorouter preserves multi-branch pcbPaths copper as fixed obstacles", async () => {
  const { circuit } = getTestFixture()
  let initialTraces: PcbTrace[] | undefined

  circuit.on("autorouting:start", () => {
    initialTraces ??= structuredClone(circuit.db.pcb_trace.list())
  })

  circuit.add(
    <board width="20mm" height="14mm" schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={2} />
      <resistor name="R3" resistance="1k" footprint="0603" pcbX={5} pcbY={-2} />
      <resistor
        name="R_TOP"
        resistance="1k"
        footprint="0603"
        pcbX={-1}
        pcbY={5}
        pcbRotation={90}
      />
      <resistor
        name="R_BOTTOM"
        resistance="1k"
        footprint="0603"
        pcbX={-1}
        pcbY={-5}
        pcbRotation={90}
      />
      <trace
        path={[".R1 > .pin2", ".R2 > .pin1", ".R3 > .pin1"]}
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPaths={[
          [".R1 > .pin2", { x: 4, y: 0 }],
          [{ x: 4, y: 0 }, ".R2 > .pin1"],
          [{ x: 4, y: 0 }, ".R3 > .pin1"],
        ]}
      />
      <trace from=".R_BOTTOM > .pin2" to=".R_TOP > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(initialTraces).toHaveLength(3)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  for (const initial of initialTraces!) {
    const after = circuit.db.pcb_trace.get(initial.pcb_trace_id)
    expect(after).toBeDefined()
    expect(after!.route).toEqual(initial.route)
  }

  const allTraces = circuit.db.pcb_trace.list()
  expect(allTraces.length).toBe(4)
  for (const t of allTraces) {
    expect((t as any).__replaces_pcb_trace_id).toBeUndefined()
  }
})
