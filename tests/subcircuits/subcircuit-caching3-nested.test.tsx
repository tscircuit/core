import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Deeply nested subcircuit caching with cached subcircuits at every level,
 * multiple identical copies per level, traces, and colored fabrication-note
 * rects annotating each nesting depth.
 *
 * ┌─ Deep_0 (L1 cached MISS) ─────────────────────────────────────┐
 * │  ┌─ Mid_A, Mid_B (L2 subcircuits, ×2 identical) ────────────┐ │
 * │  │  ┌─ Core_xP, Core_xQ, Core_xR (L3 cached, ×3 ident.) ─┐ │ │
 * │  │  │  ┌─ Cell_y1, Cell_y2, Cell_y3 (L4 cached, ×3 id.) ┐ │ │ │
 * │  │  │  │  ┌─ Atom_z (L5 cached, ×3 identical) ─────────┐ │ │ │ │
 * │  │  │  │  │  R_atom(1k) + C_atom(100nF)                 │ │ │ │ │
 * │  │  │  │  └─────────────────────────────────────────────┘ │ │ │ │
 * │  │  │  │  R_core                                          │ │ │ │
 * │  │  │  └──────────────────────────────────────────────────┘ │ │ │
 * │  │  │  R_mid + D_mid                                        │ │ │
 * │  │  └───────────────────────────────────────────────────────┘ │ │
 * │  Ind_deep + R_deep + trace(Ind_deep→R_deep)                   │ │
 * └────────────────────────────────────────────────────────────────┘ │
 * Deep_1 (L1 cached HIT, identical to Deep_0)                       │
 *
 * ┌─ Side_0 (L1 cached MISS) ──────────────────┐
 * │  ┌─ Plug_A (L2 cached, unique) ──────────┐ │
 * │  │  R_plug(22k) + C_plug(47nF)           │ │
 * │  └────────────────────────────────────────┘ │
 * │  ┌─ Plug_B (L2 cached, different) ───────┐ │
 * │  │  chip U_plug(soic8) + R_bias(100k)     │ │
 * │  └────────────────────────────────────────┘ │
 * │  Cap_s + R_s + trace(Cap_s→R_s)             │
 * └──────────────────────────────────────────────┘
 * Side_1 (L1 cached HIT)
 *
 * ┌─ Solo_0 (L1 cached MISS, flat) ─┐
 * │  R_solo + D_solo + trace          │
 * └───────────────────────────────────┘
 *
 * Component counts:
 *   Atom=2  Cell=3×2+1=7  Core=3×7+2=23  Mid=2×23=46  Deep=46+2=48
 *   Plug_A=2  Plug_B=2  Side=2+2+2=6  Solo=2
 *   Total = 2×Deep(48) + 2×Side(6) + Solo(2) = 110
 */
test("subcircuit caching with 5-level nesting and colored annotations", async () => {
  const { circuit } = getTestFixture()

  const colX = [-60, 0, 60]
  const rowSp = 50
  const rowY = (r: number) => 40 - r * rowSp
  const rectW = 45
  const rectH = 40

  // Silkscreen label per top-level subcircuit
  const Label = ({
    text,
    pcbX,
    pcbY,
  }: { text: string; pcbX: number; pcbY: number }) => (
    <>
      <silkscreentext
        text={text}
        pcbX={pcbX}
        pcbY={pcbY + rectH / 2 + 1.5}
        fontSize="0.7mm"
      />
    </>
  )

  // Colored fabrication-note rects for Deep nesting levels
  const NestingAnnotations = ({ cx, cy }: { cx: number; cy: number }) => (
    <>
      <fabricationnoterect
        pcbX={cx}
        pcbY={cy}
        width={38}
        height={34}
        color="blue"
      />
      <fabricationnotetext
        text="L2: Mid"
        pcbX={cx + 19}
        pcbY={cy + 17}
        fontSize="0.7mm"
        color="blue"
      />
      <fabricationnoterect
        pcbX={cx - 1}
        pcbY={cy + 1}
        width={28}
        height={24}
        color="green"
      />
      <fabricationnotetext
        text="L3: Core"
        pcbX={cx + 13}
        pcbY={cy + 13}
        fontSize="0.7mm"
        color="green"
      />
      <fabricationnoterect
        pcbX={cx - 2}
        pcbY={cy + 3}
        width={18}
        height={14}
        color="orange"
      />
      <fabricationnotetext
        text="L4: Cell"
        pcbX={cx + 7}
        pcbY={cy + 10}
        fontSize="0.7mm"
        color="orange"
      />
      <fabricationnoterect
        pcbX={cx - 4}
        pcbY={cy + 5}
        width={8}
        height={6}
        color="red"
      />
      <fabricationnotetext
        text="L5: Atom"
        pcbX={cx + 1}
        pcbY={cy + 8}
        fontSize="0.7mm"
        color="red"
      />
    </>
  )

  // Colored fabrication-note rects for Side modules
  const SideAnnotations = ({ cx, cy }: { cx: number; cy: number }) => (
    <>
      <fabricationnoterect
        pcbX={cx - 4}
        pcbY={cy + 6}
        width={16}
        height={12}
        color="purple"
      />
      <fabricationnotetext
        text="Plug_A"
        pcbX={cx + 6}
        pcbY={cy + 12}
        fontSize="0.7mm"
        color="purple"
      />
      <fabricationnoterect
        pcbX={cx - 4}
        pcbY={cy - 8}
        width={16}
        height={12}
        color="teal"
      />
      <fabricationnotetext
        text="Plug_B"
        pcbX={cx + 6}
        pcbY={cy - 8}
        fontSize="0.7mm"
        color="teal"
      />
    </>
  )

  // ===== L5: Atom (innermost) =====
  const Atom = () => (
    <>
      <resistor name="R_atom" resistance="1k" footprint="0402" />
      <capacitor
        name="C_atom"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={2}
      />
    </>
  )

  // ===== L4: Cell — 3 identical cached Atoms + R_core =====
  const Cell = () => (
    <>
      <subcircuit name="At1" _subcircuitCachingEnabled>
        <Atom />
      </subcircuit>
      <subcircuit name="At2" _subcircuitCachingEnabled pcbX={4}>
        <Atom />
      </subcircuit>
      <subcircuit name="At3" _subcircuitCachingEnabled pcbX={8}>
        <Atom />
      </subcircuit>
      <resistor
        name="R_core"
        resistance="4.7k"
        footprint="0402"
        pcbX={4}
        pcbY={-4}
      />
    </>
  )

  // ===== L3: Core — 3 identical cached Cells + R_mid + D_mid =====
  const Core = () => (
    <>
      <subcircuit name="Cel1" _subcircuitCachingEnabled>
        <Cell />
      </subcircuit>
      <subcircuit name="Cel2" _subcircuitCachingEnabled pcbX={0} pcbY={8}>
        <Cell />
      </subcircuit>
      <subcircuit name="Cel3" _subcircuitCachingEnabled pcbX={0} pcbY={-8}>
        <Cell />
      </subcircuit>
      <resistor
        name="R_mid"
        resistance="10k"
        footprint="0402"
        pcbX={12}
        pcbY={2}
      />
      <diode name="D_mid" footprint="0603" pcbX={12} pcbY={-2} />
    </>
  )

  // ===== L2: Mid — 2 identical cached Cores =====
  const Mid = () => (
    <>
      <subcircuit name="Cor1" _subcircuitCachingEnabled pcbX={-8}>
        <Core />
      </subcircuit>
      <subcircuit name="Cor2" _subcircuitCachingEnabled pcbX={8}>
        <Core />
      </subcircuit>
    </>
  )

  // ===== L1: Deep — Mid + Ind + R + trace =====
  const Deep = () => (
    <>
      <subcircuit name="Mid1">
        <Mid />
      </subcircuit>
      <inductor
        name="Ind_deep"
        inductance="10uH"
        footprint="0402"
        pcbX={-18}
        pcbY={0}
      />
      <resistor
        name="R_deep"
        resistance="220"
        footprint="0402"
        pcbX={-18}
        pcbY={4}
      />
      <trace from=".Ind_deep > .pin2" to=".R_deep > .pin1" />
    </>
  )

  // ===== Side tree =====
  const PlugA = () => (
    <>
      <resistor name="R_plug" resistance="22k" footprint="0402" />
      <capacitor
        name="C_plug"
        capacitance="47nF"
        footprint="0402"
        pcbX={0}
        pcbY={3}
      />
    </>
  )

  const PlugB = () => (
    <>
      <chip
        name="U_plug"
        footprint="soic8"
        pinLabels={{
          pin1: "IN",
          pin2: "GND",
          pin3: "EN",
          pin4: "NC",
          pin5: "OUT",
          pin6: "FB",
          pin7: "VIN",
          pin8: "SW",
        }}
      />
      <resistor
        name="R_bias"
        resistance="100k"
        footprint="0402"
        pcbX={0}
        pcbY={5}
      />
    </>
  )

  const Side = () => (
    <>
      <subcircuit name="Plug_A" _subcircuitCachingEnabled pcbX={-5} pcbY={6}>
        <PlugA />
      </subcircuit>
      <subcircuit name="Plug_B" _subcircuitCachingEnabled pcbX={-5} pcbY={-8}>
        <PlugB />
      </subcircuit>
      <capacitor
        name="Cap_s"
        capacitance="10uF"
        footprint="0402"
        pcbX={10}
        pcbY={3}
      />
      <resistor
        name="R_s"
        resistance="1k"
        footprint="0402"
        pcbX={10}
        pcbY={-3}
      />
      <trace from=".Cap_s > .pin2" to=".R_s > .pin1" />
    </>
  )

  // ===== Solo (flat) =====
  const Solo = () => (
    <>
      <resistor name="R_solo" resistance="100" footprint="0402" />
      <diode name="D_solo" footprint="0603" pcbX={0} pcbY={5} />
      <trace from=".R_solo > .pin2" to=".D_solo > .anode" />
    </>
  )

  circuit.add(
    <board width="180mm" height="140mm">
      {/* ===== Column 1: Deep pair (5-level nesting) ===== */}
      <silkscreentext
        text="Deep: 5-level nesting"
        pcbX={colX[0]}
        pcbY={rowY(0) + rectH / 2 + 3}
        fontSize="0.8mm"
      />
      <NestingAnnotations cx={colX[0]} cy={rowY(0)} />

      <Label text="Deep_0 MISS" pcbX={colX[0]} pcbY={rowY(0)} />
      <subcircuit
        name="Deep_0"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(0)}
      >
        <Deep />
      </subcircuit>

      <Label text="Deep_1 HIT" pcbX={colX[0]} pcbY={rowY(1)} />
      <subcircuit
        name="Deep_1"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(1)}
      >
        <Deep />
      </subcircuit>

      {/* ===== Column 2: Side pair (unique + different plugs) ===== */}
      <silkscreentext
        text="Side: 2 unique plugs"
        pcbX={colX[1]}
        pcbY={rowY(0) + rectH / 2 + 3}
        fontSize="0.8mm"
      />
      <SideAnnotations cx={colX[1]} cy={rowY(0)} />

      <Label text="Side_0 MISS" pcbX={colX[1]} pcbY={rowY(0)} />
      <subcircuit
        name="Side_0"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(0)}
      >
        <Side />
      </subcircuit>

      <Label text="Side_1 HIT" pcbX={colX[1]} pcbY={rowY(1)} />
      <subcircuit
        name="Side_1"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(1)}
      >
        <Side />
      </subcircuit>

      {/* ===== Column 3: Solo (flat, no nesting) ===== */}
      <silkscreentext
        text="Solo: flat"
        pcbX={colX[2]}
        pcbY={rowY(0) + rectH / 2 + 3}
        fontSize="0.8mm"
      />
      <Label text="Solo_0 MISS" pcbX={colX[2]} pcbY={rowY(0)} />
      <subcircuit
        name="Solo_0"
        _subcircuitCachingEnabled
        pcbX={colX[2]}
        pcbY={rowY(0)}
      >
        <Solo />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  const sourceGroups = circuitJson.filter((e: any) => e.type === "source_group")
  const groupNames = sourceGroups.map((e: any) => e.name)
  const pcbComponents = circuitJson.filter(
    (e: any) => e.type === "pcb_component",
  )
  const sourcePorts = circuitJson.filter((e: any) => e.type === "source_port")

  // ---------------------------------------------------------------
  // 1. All top-level subcircuit groups present
  // ---------------------------------------------------------------
  for (const name of ["Deep_0", "Deep_1", "Side_0", "Side_1", "Solo_0"]) {
    expect(groupNames).toContain(name)
  }

  // ---------------------------------------------------------------
  // 2. Nested groups from Deep tree
  // ---------------------------------------------------------------
  expect(
    groupNames.filter((n: string) => n === "Mid1").length,
  ).toBeGreaterThanOrEqual(1)

  // ---------------------------------------------------------------
  // 3. Nested groups from Side tree
  // ---------------------------------------------------------------
  expect(
    groupNames.filter((n: string) => n === "Plug_A").length,
  ).toBeGreaterThanOrEqual(1)
  expect(
    groupNames.filter((n: string) => n === "Plug_B").length,
  ).toBeGreaterThanOrEqual(1)

  // ---------------------------------------------------------------
  // 4. Cache has exactly 3 unique top-level structures:
  //    Deep (Deep_0 miss, Deep_1 hit), Side (Side_0 miss, Side_1 hit), Solo
  //    Note: Nested cached subcircuits (Atom, Cell, Core, Plug_A, Plug_B)
  //    inside a parent cached subcircuit are rendered within the parent's
  //    isolated circuit and don't create their own cache entries.
  // ---------------------------------------------------------------
  expect(circuit._cachedSubcircuitCircuitJson.size).toBe(3)

  // ---------------------------------------------------------------
  // 5. All source_component_ids unique
  // ---------------------------------------------------------------
  const scIds = sourceComponents.map((e: any) => e.source_component_id)
  expect(new Set(scIds).size).toBe(scIds.length)

  // ---------------------------------------------------------------
  // 6. All pcb_component_ids unique
  // ---------------------------------------------------------------
  const pcbIds = pcbComponents.map((e: any) => e.pcb_component_id)
  expect(new Set(pcbIds).size).toBe(pcbIds.length)

  // ---------------------------------------------------------------
  // 7. All source_port_ids unique
  // ---------------------------------------------------------------
  const portIds = sourcePorts.map((e: any) => e.source_port_id)
  expect(new Set(portIds).size).toBe(portIds.length)

  // ---------------------------------------------------------------
  // 8. pcb_component count matches source_component count
  // ---------------------------------------------------------------
  expect(pcbComponents.length).toBe(sourceComponents.length)

  // ---------------------------------------------------------------
  // 9. Component type diversity across all nesting levels
  // ---------------------------------------------------------------
  const ftypes = new Set(sourceComponents.map((e: any) => e.ftype))
  expect(ftypes.has("simple_resistor")).toBe(true)
  expect(ftypes.has("simple_capacitor")).toBe(true)
  expect(ftypes.has("simple_diode")).toBe(true)
  expect(ftypes.has("simple_inductor")).toBe(true)
  expect(ftypes.has("simple_chip")).toBe(true)

  // ---------------------------------------------------------------
  // 10. Total component count:
  //   Atom=2  Cell=3×2+1=7  Core=3×7+2=23  Mid=2×23=46  Deep=46+2=48
  //   Plug_A=2  Plug_B=2  Side=2+2+2=6  Solo=2
  //   Total = 2×48 + 2×6 + 2 = 110
  // ---------------------------------------------------------------
  expect(sourceComponents.length).toBe(110)

  // ---------------------------------------------------------------
  // 11. PCB snapshot
  // ---------------------------------------------------------------
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
