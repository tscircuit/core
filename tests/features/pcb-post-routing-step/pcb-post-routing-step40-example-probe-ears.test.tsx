import { expect, test } from "bun:test"
import type { PcbPostRoutingContext } from "@tscircuit/props"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Example: probe "ears" (the use case behind tscircuit/core#4629).
 *
 * A press-fit contact is probed from above by a test fixture. The bare ring is
 * too small to land on reliably, so each contact grows an "ear": an exposed
 * copper lobe joined to its ring, on the contact's own port. Where the ear can
 * go depends on where the traces went, so it is chosen after routing: the
 * biggest lobe, at the angle with the most room, that stays inside the
 * contact's 2 mm cell and 0.15 mm from other nets. The component does this
 * itself with a <pcbpostroutingstep render />, in TSX; the board only places
 * contacts.
 */
type P = { x: number; y: number }
const CELL_INSET = 0.925 // half the 2 mm cell, minus half the clearance
const CLEAR = 0.15
const RING_R = 0.75

const pointSeg = (p: P, a: P, b: P) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const L = dx * dx + dy * dy
  const t = L
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L))
    : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
const segSeg = (a: P, b: P, c: P, d: P) =>
  Math.min(
    pointSeg(a, c, d),
    pointSeg(b, c, d),
    pointSeg(c, a, b),
    pointSeg(d, a, b),
  )

/** The ear: a lobe of radius r at (angle, d) joined to the centre by a slot as wide as the lobe. */
const stadium = (angle: number, r: number, d: number, n = 24): P[] => {
  const e = { x: d * Math.cos(angle), y: d * Math.sin(angle) }
  const arc = (c: P, from: number) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const t = from + (Math.PI * i) / n
      return { x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t) }
    })
  return [
    ...arc(e, angle - Math.PI / 2),
    ...arc({ x: 0, y: 0 }, angle + Math.PI / 2),
  ]
}

/** Other-net copper near the contact, as segments with a half-width (a circle is a zero-length segment). */
const obstaclesFor = (ctx: PcbPostRoutingContext, name: string) => {
  const own = ctx.getPcbPort(`.${name} > .pin1`)!
  const c = ctx.getPcbComponent(`.${name}`)!.center
  const local = (p: P) => ({ x: p.x - c.x, y: p.y - c.y })
  const obstacles: Array<{ a: P; b: P; hw: number }> = []
  for (const e of ctx.getCircuitJson() as any[]) {
    if (e.type === "pcb_trace") {
      const wires = e.route.filter(
        (p: any) => p.route_type === "wire" && p.layer === "top",
      )
      // the contact's own escape starts inside its ring
      if (wires.some((p: P) => Math.hypot(p.x - c.x, p.y - c.y) < 0.65))
        continue
      for (let i = 1; i < wires.length; i++)
        obstacles.push({
          a: local(wires[i - 1]),
          b: local(wires[i]),
          hw: wires[i].width / 2,
        })
    } else if (e.type === "pcb_via" || e.type === "pcb_plated_hole") {
      if (e.pcb_port_id === own.pcb_port_id) continue
      const p = local(e)
      obstacles.push({ a: p, b: p, hw: e.outer_diameter / 2 })
    }
  }
  return obstacles
}

const placeEar = (ctx: PcbPostRoutingContext, name: string) => {
  const obstacles = obstaclesFor(ctx, name)
  for (let r = 0.45; r >= 0.2 - 1e-9; r -= 0.05) {
    let best: { angle: number; d: number; room: number } | null = null
    for (let k = 0; k < 72; k++) {
      const angle = (k * Math.PI) / 36
      // as far out as the cell allows
      const d =
        (CELL_INSET - r) /
        Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)))
      const lobe = { x: d * Math.cos(angle), y: d * Math.sin(angle) }
      const room = Math.min(
        ...obstacles.map(
          (o) => segSeg({ x: 0, y: 0 }, lobe, o.a, o.b) - o.hw - r,
        ),
      )
      if (room >= CLEAR && (!best || room > best.room))
        best = { angle, d, room }
    }
    if (best) return { ...best, r }
  }
  return null
}

const ProbeContact = ({
  name,
  pcbX,
  pcbY,
}: { name: string; pcbX: number; pcbY: number }) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    isSmt={false}
    footprint={
      <footprint>
        <platedhole
          shape="circle"
          holeDiameter={0.78}
          outerDiameter={1.3}
          portHints={["1"]}
          pcbX={0}
          pcbY={0}
        />
        <pcbpostroutingstep
          name={`${name} ear`}
          render={(ctx) => {
            const ear = placeEar(ctx, name)
            if (!ear)
              return (
                <silkscreencircle
                  pcbX={0}
                  pcbY={0}
                  radius={RING_R}
                  strokeWidth={0.05}
                />
              )
            // the silk ring opens where the ear crosses it
            const half = Math.asin(Math.min(1, (ear.r + 0.12) / RING_R))
            const ring = Array.from({ length: 41 }, (_, i) => {
              const t = ear.angle + half + ((2 * Math.PI - 2 * half) * i) / 40
              return { x: RING_R * Math.cos(t), y: RING_R * Math.sin(t) }
            })
            return (
              <>
                <smtpad
                  shape="polygon"
                  layer="top"
                  portHints={["1"]}
                  points={stadium(ear.angle, ear.r, ear.d)}
                />
                <silkscreenpath route={ring} strokeWidth={0.05} />
              </>
            )
          }}
        />
      </footprint>
    }
  />
)

test("example: each contact adds a probe ear in TSX where the routing left room", async () => {
  const { circuit } = getTestFixture()
  const escapeX = [-0.4, 0, 0.4, -0.4]
  circuit.add(
    <board width="14mm" height="12mm">
      {[0, 1, 2, 3].flatMap((i) =>
        [0, 1].map((j) => {
          const name = `MC${i + 1 + j * 4}`
          const x = -3 + 2 * i
          const y = 1 - 2 * j
          return (
            <Fragment key={name}>
              <ProbeContact name={name} pcbX={x} pcbY={y} />
              <via
                name={`V${name}`}
                pcbX={x + escapeX[i]}
                pcbY={j ? -4.5 : 4.5}
                holeDiameter={0.3}
                outerDiameter={0.6}
              />
              <trace
                from={`.${name} > .pin1`}
                to={`.V${name} > .top`}
                thickness={0.2}
                pcbStraightLine
              />
            </Fragment>
          )
        }),
      )}
      {/* other nets through two of the column gaps */}
      {[-2, 2].map((x) => (
        <Fragment key={x}>
          <via
            name={`T${x + 2}`}
            pcbX={x}
            pcbY={5.3}
            holeDiameter={0.3}
            outerDiameter={0.6}
          />
          <via
            name={`B${x + 2}`}
            pcbX={x}
            pcbY={-5.3}
            holeDiameter={0.3}
            outerDiameter={0.6}
          />
          <trace
            from={`.T${x + 2} > .top`}
            to={`.B${x + 2} > .top`}
            thickness={0.2}
            pcbStraightLine
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const cj = circuit.getCircuitJson() as any[]
  const holes = cj.filter((e) => e.type === "pcb_plated_hole")
  const ears = cj.filter(
    (e) => e.type === "pcb_smtpad" && e.shape === "polygon",
  )
  // every contact has an ear, on its own port
  expect(ears).toHaveLength(8)
  for (const ear of ears) {
    expect(holes.some((h) => h.pcb_port_id === ear.pcb_port_id)).toBe(true)
  }
  // the ears do not point the same way everywhere: they follow the traces
  const directions = new Set(
    ears.map((ear) => {
      const hole = holes.find((h) => h.pcb_port_id === ear.pcb_port_id)
      const far = ear.points.reduce((a: P, b: P) =>
        Math.hypot(b.x - hole.x, b.y - hole.y) >
        Math.hypot(a.x - hole.x, a.y - hole.y)
          ? b
          : a,
      )
      return `${Math.sign(Math.round(far.x - hole.x))},${Math.sign(Math.round(far.y - hole.y))}`
    }),
  )
  expect(directions.size).toBeGreaterThan(1)
  // and design rule checks find nothing wrong with them
  expect(
    cj.filter(
      (e) =>
        e.type.endsWith("_error") && /MC\d\.1|smtpad/.test(e.message ?? ""),
    ),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
