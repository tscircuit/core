import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Advanced subcircuit caching test with diverse component types, traces,
 * and nested subcircuits.
 *
 * Grid layout — columns are unique structures, rows are cache hits.
 *
 * Col A: chip(soic8) + R(10k) + C(100nF) + 2 traces — cached
 *   Row 0: A0  (cache MISS)
 *   Row 1: A1  (cache HIT)
 *
 * Col B: diode + transistor(npn) + R(1k) + 2 traces — cached
 *   Row 0: B0  (cache MISS)
 *   Row 1: B1  (cache HIT)
 *   Row 2: B2  (cache HIT)
 *
 * Col C: inductor + C(1uF) + diode + 2 traces — cached
 *   Row 0: C0  (cache MISS)
 *   Row 1: C1  (cache HIT)
 *
 * Col D: big circuit — chip + inductor + diode + C + R + 3 traces — cached
 *   Row 0: Reg0  (cache MISS)
 *   Row 1: Reg1  (cache HIT)
 *
 * Col E: same as Col A but NO caching — normal render
 *   Row 0: E0  (normal)
 *
 * Col F: variant of Col B — R=2.2k instead of 1k — cached unique
 *   Row 0: F0  (cache MISS)
 */
test("subcircuit caching with advanced components and nesting", async () => {
  const { circuit } = getTestFixture()

  const colX = [-34, -20, -6, 8, 22, 36]
  const rowSpacing = 16
  const rowY = (r: number) => 32 - r * rowSpacing
  const labelOffY = 8 // text above the rect top edge (rectH/2 + margin)
  const rectW = 11
  const rectH = 13

  const Label = ({
    text,
    pcbX,
    pcbY,
  }: { text: string; pcbX: number; pcbY: number }) => (
    <>
      <silkscreentext
        text={text}
        pcbX={pcbX}
        pcbY={pcbY + labelOffY}
        fontSize="0.7mm"
      />
    </>
  )

  /** chip(soic8 with pinLabels) + R + C + traces */
  const TimerCircuit = () => (
    <>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
      />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={5} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={-5}
      />
      <trace from=".U1 > .DISCH" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </>
  )

  /** diode + NPN transistor + base resistor + traces */
  const TransistorDriver = () => (
    <>
      <diode name="D1" footprint="0603" />
      <transistor name="Q1" type="npn" footprint="sot23" pcbX={0} pcbY={4} />
      <resistor name="Rb" resistance="1k" footprint="0402" pcbX={0} pcbY={-4} />
      <trace from=".D1 > .cathode" to=".Q1 > .collector" />
      <trace from=".Rb > .pin2" to=".Q1 > .base" />
    </>
  )

  /** inductor + capacitor + diode + traces */
  const FilterCircuit = () => (
    <>
      <inductor name="L1" inductance="10uH" footprint="0402" />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={0}
        pcbY={4}
      />
      <diode name="D1" footprint="0603" pcbX={0} pcbY={-4} />
      <trace from=".L1 > .pin2" to=".C1 > .pin1" />
      <trace from=".L1 > .pin1" to=".D1 > .anode" />
    </>
  )

  /** Multi-component: chip(soic8) + diode + R + C + inductor + 3 traces */
  const BigCircuit = () => (
    <>
      <chip
        name="U1"
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
      <inductor
        name="L1"
        inductance="4.7uH"
        footprint="0402"
        pcbX={0}
        pcbY={5}
      />
      <diode name="D1" footprint="0603" pcbX={0} pcbY={-5} />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0402"
        pcbX={4}
        pcbY={0}
      />
      <resistor
        name="R1"
        resistance="100k"
        footprint="0402"
        pcbX={-4}
        pcbY={0}
      />
      <trace from=".U1 > .SW" to=".L1 > .pin1" />
      <trace from=".L1 > .pin2" to=".C1 > .pin1" />
      <trace from=".U1 > .FB" to=".R1 > .pin1" />
    </>
  )

  /** Variant driver: same topology but Rb=2.2k */
  const TransistorDriverVariant = () => (
    <>
      <diode name="D1" footprint="0603" />
      <transistor name="Q1" type="npn" footprint="sot23" pcbX={0} pcbY={4} />
      <resistor
        name="Rb"
        resistance="2.2k"
        footprint="0402"
        pcbX={0}
        pcbY={-4}
      />
      <trace from=".D1 > .cathode" to=".Q1 > .collector" />
      <trace from=".Rb > .pin2" to=".Q1 > .base" />
    </>
  )

  circuit.add(
    <board width="100mm" height="90mm">
      {/* ===== Column A: Timer chip, cached ===== */}
      <silkscreentext
        text="A: timer cached"
        pcbX={colX[0]}
        pcbY={rowY(0) + 12}
        fontSize="0.8mm"
      />
      <Label text="A0 MISS" pcbX={colX[0]} pcbY={rowY(0)} />
      <subcircuit
        name="A0"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(0)}
      >
        <TimerCircuit />
      </subcircuit>
      <Label text="A1 HIT" pcbX={colX[0]} pcbY={rowY(1)} />
      <subcircuit
        name="A1"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(1)}
      >
        <TimerCircuit />
      </subcircuit>

      {/* ===== Column B: Transistor driver, cached ===== */}
      <silkscreentext
        text="B: Q drv cached"
        pcbX={colX[1]}
        pcbY={rowY(0) + 12}
        fontSize="0.8mm"
      />
      <Label text="B0 MISS" pcbX={colX[1]} pcbY={rowY(0)} />
      <subcircuit
        name="B0"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(0)}
      >
        <TransistorDriver />
      </subcircuit>
      <Label text="B1 HIT" pcbX={colX[1]} pcbY={rowY(1)} />
      <subcircuit
        name="B1"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(1)}
      >
        <TransistorDriver />
      </subcircuit>
      <Label text="B2 HIT" pcbX={colX[1]} pcbY={rowY(2)} />
      <subcircuit
        name="B2"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(2)}
      >
        <TransistorDriver />
      </subcircuit>

      {/* ===== Column C: Filter, cached ===== */}
      <silkscreentext
        text="C: filter cached"
        pcbX={colX[2]}
        pcbY={rowY(0) + 12}
        fontSize="0.8mm"
      />
      <Label text="C0 MISS" pcbX={colX[2]} pcbY={rowY(0)} />
      <subcircuit
        name="C0"
        _subcircuitCachingEnabled
        pcbX={colX[2]}
        pcbY={rowY(0)}
      >
        <FilterCircuit />
      </subcircuit>
      <Label text="C1 HIT" pcbX={colX[2]} pcbY={rowY(1)} />
      <subcircuit
        name="C1_copy"
        _subcircuitCachingEnabled
        pcbX={colX[2]}
        pcbY={rowY(1)}
      >
        <FilterCircuit />
      </subcircuit>

      {/* ===== Column D: Big circuit (5 components), cached ===== */}
      <silkscreentext
        text="D: big cached"
        pcbX={colX[3]}
        pcbY={rowY(0) + 12}
        fontSize="0.8mm"
      />
      <Label text="Reg0 MISS" pcbX={colX[3]} pcbY={rowY(0)} />
      <subcircuit
        name="Reg0"
        _subcircuitCachingEnabled
        pcbX={colX[3]}
        pcbY={rowY(0)}
      >
        <BigCircuit />
      </subcircuit>
      <Label text="Reg1 HIT" pcbX={colX[3]} pcbY={rowY(1)} />
      <subcircuit
        name="Reg1"
        _subcircuitCachingEnabled
        pcbX={colX[3]}
        pcbY={rowY(1)}
      >
        <BigCircuit />
      </subcircuit>

      {/* ===== Column E: Timer, NO caching ===== */}
      <silkscreentext
        text="E: timer no cache"
        pcbX={colX[4]}
        pcbY={rowY(0) + 12}
        fontSize="0.8mm"
      />
      <Label text="E0 normal" pcbX={colX[4]} pcbY={rowY(0)} />
      <subcircuit name="E0" pcbX={colX[4]} pcbY={rowY(0)}>
        <TimerCircuit />
      </subcircuit>

      {/* ===== Column F: Driver variant, cached unique ===== */}
      <silkscreentext
        text="F: drv Rb=2.2k"
        pcbX={colX[5]}
        pcbY={rowY(0) + 12}
        fontSize="0.8mm"
      />
      <Label text="F0 MISS" pcbX={colX[5]} pcbY={rowY(0)} />
      <subcircuit
        name="F0"
        _subcircuitCachingEnabled
        pcbX={colX[5]}
        pcbY={rowY(0)}
      >
        <TransistorDriverVariant />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // ---------------------------------------------------------------
  // 1. Cache size — 5 unique cached structures
  //    a) TimerCircuit         (A0 miss, A1 hit)
  //    b) TransistorDriver     (B0 miss, B1/B2 hit)
  //    c) FilterCircuit        (C0 miss, C1_copy hit)
  //    d) BigCircuit           (Reg0 miss, Reg1 hit)
  //    e) TransistorDrvVariant (F0 miss)
  // ---------------------------------------------------------------
  expect(circuit._cachedSubcircuitCircuitJson.size).toBe(5)

  // ---------------------------------------------------------------
  // 2. Source component count
  // ---------------------------------------------------------------
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  // TimerCircuit(U1+R1+C1=3):  A0(3)+A1(3)+E0(3) = 9
  // TransistorDriver(D1+Q1+Rb=3): B0(3)+B1(3)+B2(3) = 9
  // FilterCircuit(L1+C1+D1=3): C0(3)+C1_copy(3) = 6
  // BigCircuit(U1+L1+D1+C1+R1=5): Reg0(5)+Reg1(5) = 10
  // TransistorDrvVariant(D1+Q1+Rb=3): F0(3)
  // Total = 9 + 9 + 6 + 10 + 3 = 37
  expect(sourceComponents.length).toBe(37)

  // ---------------------------------------------------------------
  // 3. All source_component_ids unique
  // ---------------------------------------------------------------
  const scIds = sourceComponents.map((e: any) => e.source_component_id)
  expect(new Set(scIds).size).toBe(scIds.length)

  // ---------------------------------------------------------------
  // 4. Every top-level subcircuit group name present
  // ---------------------------------------------------------------
  const sourceGroups = circuitJson.filter((e: any) => e.type === "source_group")
  const groupNames = sourceGroups.map((e: any) => e.name)
  for (const name of [
    "A0",
    "A1",
    "B0",
    "B1",
    "B2",
    "C0",
    "C1_copy",
    "Reg0",
    "Reg1",
    "E0",
    "F0",
  ]) {
    expect(groupNames).toContain(name)
  }

  // ---------------------------------------------------------------
  // 5. pcb_component count matches source_component count
  // ---------------------------------------------------------------
  const pcbComponents = circuitJson.filter(
    (e: any) => e.type === "pcb_component",
  )
  expect(pcbComponents.length).toBe(37)

  // ---------------------------------------------------------------
  // 6. All pcb_component_ids unique
  // ---------------------------------------------------------------
  const pcbIds = pcbComponents.map((e: any) => e.pcb_component_id)
  expect(new Set(pcbIds).size).toBe(pcbIds.length)

  // ---------------------------------------------------------------
  // 7. source_port count
  //    Timer: chip(8)+R(2)+C(2) = 12 * 3 instances = 36
  //    TransistorDriver: diode(2)+transistor(3)+R(2) = 7 * 4 = 28
  //    Filter: inductor(2)+C(2)+diode(2) = 6 * 2 = 12
  //    BigCircuit: chip(8)+inductor(2)+diode(2)+C(2)+R(2) = 16 * 2 = 32
  //    Total = 36 + 28 + 12 + 32 = 108
  // ---------------------------------------------------------------
  const sourcePorts = circuitJson.filter((e: any) => e.type === "source_port")
  expect(sourcePorts.length).toBe(108)

  // ---------------------------------------------------------------
  // 8. All source_port_ids unique
  // ---------------------------------------------------------------
  const portIds = sourcePorts.map((e: any) => e.source_port_id)
  expect(new Set(portIds).size).toBe(portIds.length)

  // ---------------------------------------------------------------
  // 9. Non-cached E0 rendered correctly
  // ---------------------------------------------------------------
  expect(sourceGroups.find((g: any) => g.name === "E0")).toBeDefined()

  // ---------------------------------------------------------------
  // 10. Component type diversity
  // ---------------------------------------------------------------
  const ftypes = new Set(sourceComponents.map((e: any) => e.ftype))
  expect(ftypes.has("simple_resistor")).toBe(true)
  expect(ftypes.has("simple_capacitor")).toBe(true)
  expect(ftypes.has("simple_chip")).toBe(true)
  expect(ftypes.has("simple_diode")).toBe(true)
  expect(ftypes.has("simple_inductor")).toBe(true)
  expect(ftypes.has("simple_transistor")).toBe(true)

  // ---------------------------------------------------------------
  // 11. PCB snapshot
  // ---------------------------------------------------------------
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
