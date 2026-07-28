import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("create solderpaste from L-shaped polygon smtpad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="polygon"
        points={[
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 1 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 0, y: 2 },
        ]}
        layer={"top"}
        portHints={[]}
      />
    </board>,
  )

  circuit.render()

  const [smtpad] = circuit.db.pcb_smtpad.list()
  const solderPastes = circuit.db.pcb_solder_paste.list()

  expect(solderPastes.length).toBe(2)
  expect(
    solderPastes.every(
      (sp) => sp.pcb_smtpad_id === smtpad.pcb_smtpad_id && sp.layer === "top",
    ),
  ).toBe(true)
  expect(
    solderPastes.map((sp) => ({
      shape: sp.shape,
      x: sp.x,
      y: sp.y,
      width: "width" in sp ? sp.width : undefined,
      height: "height" in sp ? sp.height : undefined,
    })),
  ).toEqual([
    { shape: "rect", x: 0.5, y: 1, width: 1, height: 2 },
    { shape: "rect", x: 1.5, y: 0.5, width: 1, height: 1 },
  ])
})

test("create solderpaste from polygon smtpad with a notched edge", async () => {
  const { circuit } = getTestFixture()
  // Land shape used by leadless packages such as TI's B0QFN: a rect with a
  // notch cut out of the middle of its right edge.
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="polygon"
        points={[
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 1 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
        ]}
        layer={"top"}
        portHints={[]}
      />
    </board>,
  )

  circuit.render()

  const solderPastes = circuit.db.pcb_solder_paste.list()

  // 3 x 3 slab left of the notch, plus the two 1 x 1 spans beside it
  expect(
    solderPastes.map((sp) => ({
      x: sp.x,
      y: sp.y,
      width: "width" in sp ? sp.width : undefined,
      height: "height" in sp ? sp.height : undefined,
    })),
  ).toEqual([
    { x: 1.5, y: 1.5, width: 3, height: 3 },
    { x: 3.5, y: 0.5, width: 1, height: 1 },
    { x: 3.5, y: 2.5, width: 1, height: 1 },
  ])

  // the notch is not pasted
  const pastedArea = solderPastes.reduce(
    (area, sp) =>
      area + ("width" in sp && "height" in sp ? sp.width * sp.height : 0),
    0,
  )
  expect(pastedArea).toBe(11)
})

test("polygon smtpad solderpaste is not created when covered with solder mask", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="polygon"
        points={[
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ]}
        layer={"top"}
        coveredWithSolderMask
        portHints={[]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_solder_paste.list().length).toBe(0)
})

test("polygon smtpad solderpaste follows the pad when layout moves it", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              points={[
                { x: 0, y: 0 },
                { x: 2, y: 0 },
                { x: 2, y: 1 },
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 0, y: 2 },
              ]}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="0.6mm"
              height="0.6mm"
              portHints={["pin2"]}
            />
            <constraint
              pcb
              centerToCenter
              xDist="4mm"
              left=".pin1"
              right=".pin2"
            />
            <constraint sameY for={[".pin1", ".pin2"]} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pad = circuit.db.pcb_smtpad
    .list()
    .find((p) => p.shape === "polygon") as any
  const solderPastes = circuit.db.pcb_solder_paste
    .list()
    .filter((sp) => sp.pcb_smtpad_id === pad.pcb_smtpad_id) as any[]

  expect(solderPastes.length).toBe(2)

  // the layout moved the pad, so the paste has to have moved with it
  const xs = pad.points.map((p: any) => p.x)
  const ys = pad.points.map((p: any) => p.y)
  for (const sp of solderPastes) {
    expect(sp.x - sp.width / 2).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-9)
    expect(sp.x + sp.width / 2).toBeLessThanOrEqual(Math.max(...xs) + 1e-9)
    expect(sp.y - sp.height / 2).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-9)
    expect(sp.y + sp.height / 2).toBeLessThanOrEqual(Math.max(...ys) + 1e-9)
  }
})

test("non-rectilinear polygon smtpad does not emit sliver apertures", async () => {
  const { circuit } = getTestFixture()
  // A polygonised round pad: the slabs at the left and right extremes are
  // bounded by two converging edges and degenerate to slivers.
  const points = Array.from({ length: 32 }, (_, i) => ({
    x: 0.5 * Math.cos((i / 32) * 2 * Math.PI),
    y: 0.5 * Math.sin((i / 32) * 2 * Math.PI),
  }))
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad shape="polygon" points={points} layer={"top"} portHints={[]} />
    </board>,
  )

  circuit.render()

  const solderPastes = circuit.db.pcb_solder_paste.list() as any[]
  expect(solderPastes.length).toBeGreaterThan(0)
  for (const sp of solderPastes) {
    expect(Math.min(sp.width, sp.height)).toBeGreaterThan(0.005)
  }
})

test("paste rects never extend outside a non-rectilinear polygon pad", async () => {
  const { circuit } = getTestFixture()
  // House pentagon: slabs bounded above by the two slanted roof edges. The
  // pre-extrapolation sweep emitted rect corners past a slanted bounding edge
  // (paste off copper); the extrapolated sweep must keep every corner inside.
  const points = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 1 },
  ]
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad shape="polygon" points={points} layer={"top"} portHints={[]} />
    </board>,
  )

  circuit.render()

  const solderPastes = circuit.db.pcb_solder_paste.list() as any[]
  expect(solderPastes.length).toBeGreaterThan(0)
  for (const sp of solderPastes) {
    for (const [cx, cy] of [
      [sp.x - sp.width / 2, sp.y - sp.height / 2],
      [sp.x + sp.width / 2, sp.y - sp.height / 2],
      [sp.x - sp.width / 2, sp.y + sp.height / 2],
      [sp.x + sp.width / 2, sp.y + sp.height / 2],
    ] as const) {
      // inside the house: 0 <= x <= 2, y >= 0, x+y <= 3, y <= x+1
      expect(cx).toBeGreaterThanOrEqual(-1e-9)
      expect(cx).toBeLessThanOrEqual(2 + 1e-9)
      expect(cy).toBeGreaterThanOrEqual(-1e-9)
      expect(cx + cy).toBeLessThanOrEqual(3 + 1e-9)
      expect(cy).toBeLessThanOrEqual(cx + 1 + 1e-9)
    }
  }
})
